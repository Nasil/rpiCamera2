"use strict";

function Image(width, height, data){
  this.width = width || 0;
  this.height = height || 0;
  this.data = data || [];
};

function findMarkers(imageSrc, candidates, warpSize){
  var markers = [], len = candidates.length, candidate, marker, i;
  let homography = new Image();

  for (i = 0; i < len; ++ i){
    candidate = candidates[i];
    warp(imageSrc, homography, candidate, warpSize);
    threshold(homography, homography, otsu(homography) );
    marker = getMarker(homography, candidate);
    console.log(marker);
    if (marker){
      markers.push(marker);
    }
  }

  return markers;
};

function getMarker(imageSrc, candidate){
  var width = (imageSrc.width / 7) >>> 0,
      minZero = (width * width) >> 1,
      bits = [], rotations = [], distances = [],
      square, pair, inc, i, j;

  for (i = 0; i < 7; ++ i){
    inc = (0 === i || 6 === i)? 1: 6;

    for (j = 0; j < 7; j += inc){
      square = {x: j * width, y: i * width, width: width, height: width};
      if ( countNonZero(imageSrc, square) > minZero){
        return null;
      }
    }
  }

  for (i = 0; i < 5; ++ i){
    bits[i] = [];

    for (j = 0; j < 5; ++ j){
      square = {x: (j + 1) * width, y: (i + 1) * width, width: width, height: width};

      bits[i][j] = countNonZero(imageSrc, square) > minZero? 1: 0;
    }
  }

  rotations[0] = bits;
  distances[0] = hammingDistance( rotations[0] );

  pair = {first: distances[0], second: 0};

  for (i = 1; i < 4; ++ i){
    rotations[i] = rotate( rotations[i - 1] );
    distances[i] = hammingDistance( rotations[i] );

    if (distances[i] < pair.first){
      pair.first = distances[i];
      pair.second = i;
    }
  }

  if (0 !== pair.first){
    return null;
  }

  return new AR.Marker(
    mat2id( rotations[pair.second] ),
    rotate2(candidate, 4 - pair.second) );
};

function hammingDistance(bits){
  var ids = [ [1,0,0,0,0], [1,0,1,1,1], [0,1,0,0,1], [0,1,1,1,0] ],
      dist = 0, sum, minSum, i, j, k;

  for (i = 0; i < 5; ++ i){
    minSum = Infinity;

    for (j = 0; j < 4; ++ j){
      sum = 0;

      for (k = 0; k < 5; ++ k){
          sum += bits[i][k] === ids[j][k]? 0: 1;
      }

      if (sum < minSum){
        minSum = sum;
      }
    }

    dist += minSum;
  }

  return dist;
};

function mat2id(bits){
  var id = 0, i;

  for (i = 0; i < 5; ++ i){
    id <<= 1;
    id |= bits[i][1];
    id <<= 1;
    id |= bits[i][3];
  }

  return id;
};

function rotate(src){
  var dst = [], len = src.length, i, j;

  for (i = 0; i < len; ++ i){
    dst[i] = [];
    for (j = 0; j < src[i].length; ++ j){
      dst[i][j] = src[src[i].length - j - 1][i];
    }
  }

  return dst;
};

function rotate2(src, rotation){
  var dst = [], len = src.length, i;

  for (i = 0; i < len; ++ i){
    dst[i] = src[ (rotation + i) % len ];
  }

  return dst;
};


function warp(imageSrc, imageDst, contour, warpSize){
  var src = imageSrc.data, dst = imageDst.data,
      width = imageSrc.width, height = imageSrc.height,
      pos = 0,
      sx1, sx2, dx1, dx2, sy1, sy2, dy1, dy2, p1, p2, p3, p4,
      m, r, s, t, u, v, w, x, y, i, j;

  m = getPerspectiveTransform(contour, warpSize - 1);

  r = m[8];
  s = m[2];
  t = m[5];

  for (i = 0; i < warpSize; ++ i){
    r += m[7];
    s += m[1];
    t += m[4];

    u = r;
    v = s;
    w = t;

    for (j = 0; j < warpSize; ++ j){
      u += m[6];
      v += m[0];
      w += m[3];

      x = v / u;
      y = w / u;

      sx1 = x >>> 0;
      sx2 = (sx1 === width - 1)? sx1: sx1 + 1;
      dx1 = x - sx1;
      dx2 = 1.0 - dx1;

      sy1 = y >>> 0;
      sy2 = (sy1 === height - 1)? sy1: sy1 + 1;
      dy1 = y - sy1;
      dy2 = 1.0 - dy1;

      p1 = p2 = sy1 * width;
      p3 = p4 = sy2 * width;

      dst[pos ++] =
        (dy2 * (dx2 * src[p1 + sx1] + dx1 * src[p2 + sx2]) +
         dy1 * (dx2 * src[p3 + sx1] + dx1 * src[p4 + sx2]) ) & 0xff;

    }
  }

  imageDst.width = warpSize;
  imageDst.height = warpSize;

  return imageDst;
};

function getPerspectiveTransform(src, size){
  var rq = square2quad(src);

  rq[0] /= size;
  rq[1] /= size;
  rq[3] /= size;
  rq[4] /= size;
  rq[6] /= size;
  rq[7] /= size;

  return rq;
};

function square2quad(src){
  var sq = [], px, py, dx1, dx2, dy1, dy2, den;

  px = src[0].x - src[1].x + src[2].x - src[3].x;
  py = src[0].y - src[1].y + src[2].y - src[3].y;

  if (0 === px && 0 === py){
    sq[0] = src[1].x - src[0].x;
    sq[1] = src[2].x - src[1].x;
    sq[2] = src[0].x;
    sq[3] = src[1].y - src[0].y;
    sq[4] = src[2].y - src[1].y;
    sq[5] = src[0].y;
    sq[6] = 0;
    sq[7] = 0;
    sq[8] = 1;
  } else {
    dx1 = src[1].x - src[2].x;
    dx2 = src[3].x - src[2].x;
    dy1 = src[1].y - src[2].y;
    dy2 = src[3].y - src[2].y;
    den = dx1 * dy2 - dx2 * dy1;

    sq[6] = (px * dy2 - dx2 * py) / den;
    sq[7] = (dx1 * py - px * dy1) / den;
    sq[8] = 1;
    sq[0] = src[1].x - src[0].x + sq[6] * src[1].x;
    sq[1] = src[3].x - src[0].x + sq[7] * src[3].x;
    sq[2] = src[0].x;
    sq[3] = src[1].y - src[0].y + sq[6] * src[1].y;
    sq[4] = src[3].y - src[0].y + sq[7] * src[3].y;
    sq[5] = src[0].y;
  }

  return sq;
};

function isContourConvex(contour){
  var orientation = 0, convex = true,
      len = contour.length, i = 0, j = 0,
      cur_pt, prev_pt, dxdy0, dydx0, dx0, dy0, dx, dy;

  prev_pt = contour[len - 1];
  cur_pt = contour[0];

  dx0 = cur_pt.x - prev_pt.x;
  dy0 = cur_pt.y - prev_pt.y;

  for (; i < len; ++ i){
    if (++ j === len) {j = 0;}

    prev_pt = cur_pt;
    cur_pt = contour[j];

    dx = cur_pt.x - prev_pt.x;
    dy = cur_pt.y - prev_pt.y;
    dxdy0 = dx * dy0;
    dydx0 = dy * dx0;

    orientation |= dydx0 > dxdy0? 1: (dydx0 < dxdy0? 2: 3);

    if (3 === orientation){
        convex = false;
        break;
    }

    dx0 = dx;
    dy0 = dy;
  }

  return convex;
};

function perimeter(poly){
  var len = poly.length, i = 0, j = len - 1,
      p = 0.0, dx, dy;

  for (; i < len; j = i ++){
    dx = poly[i].x - poly[j].x;
    dy = poly[i].y - poly[j].y;

    p += Math.sqrt(dx * dx + dy * dy) ;
  }

  return p;
};

function minEdgeLength(poly){
  var len = poly.length, i = 0, j = len - 1,
      min = Infinity, d, dx, dy;

  for (; i < len; j = i ++){
    dx = poly[i].x - poly[j].x;
    dy = poly[i].y - poly[j].y;

    d = dx * dx + dy * dy;

    if (d < min){
      min = d;
    }
  }

  return Math.sqrt(min);
};


function threshold(imageSrc, imageDst, threshold){
  var src = imageSrc.data, dst = imageDst.data,
      len = src.length, tab = [], i;

  for (i = 0; i < 256; ++ i){
    tab[i] = i <= threshold? 0: 255;
  }

  for (i = 0; i < len; ++ i){
    dst[i] = tab[ src[i] ];
  }

  imageDst.width = imageSrc.width;
  imageDst.height = imageSrc.height;

  return imageDst;
};

function adaptiveThreshold(imageSrc, imageDst, kernelSize, threshold){
  var src = imageSrc.data, dst = imageDst.data, len = src.length, tab = [], i;

  stackBoxBlur(imageSrc, imageDst, kernelSize);

  for (i = 0; i < 768; ++ i){
    tab[i] = (i - 255 <= -threshold)? 255: 0;
  }

  for (i = 0; i < len; ++ i){
    dst[i] = tab[ src[i] - dst[i] + 255 ];
  }

  imageDst.width = imageSrc.width;
  imageDst.height = imageSrc.height;

  return imageDst;
};

function otsu(imageSrc){
  var src = imageSrc.data, len = src.length, hist = [],
      threshold = 0, sum = 0, sumB = 0, wB = 0, wF = 0, max = 0,
      mu, between, i;

  for (i = 0; i < 256; ++ i){
    hist[i] = 0;
  }

  for (i = 0; i < len; ++ i){
    hist[ src[i] ] ++;
  }

  for (i = 0; i < 256; ++ i){
    sum += hist[i] * i;
  }

  for (i = 0; i < 256; ++ i){
    wB += hist[i];
    if (0 !== wB){

      wF = len - wB;
      if (0 === wF){
        break;
      }

      sumB += hist[i] * i;

      mu = (sumB / wB) - ( (sum - sumB) / wF );

      between = wB * wF * mu * mu;

      if (between > max){
        max = between;
        threshold = i;
      }
    }
  }

  return threshold;
};

let stackBoxBlurMult =
  [1, 171, 205, 293, 57, 373, 79, 137, 241, 27, 391, 357, 41, 19, 283, 265];

let stackBoxBlurShift =
  [0, 9, 10, 11, 9, 12, 10, 11, 12, 9, 13, 13, 10, 9, 13, 13];

function BlurStack(){
  this.color = 0;
  this.next = null;
};

function stackBoxBlur(imageSrc, imageDst, kernelSize){
  var src = imageSrc.data, dst = imageDst.data,
      height = imageSrc.height, width = imageSrc.width,
      heightMinus1 = height - 1, widthMinus1 = width - 1,
      size = kernelSize + kernelSize + 1, radius = kernelSize + 1,
      mult = stackBoxBlurMult[kernelSize],
      shift = stackBoxBlurShift[kernelSize],
      stack, stackStart, color, sum, pos, start, p, x, y, i;

  stack = stackStart = new BlurStack();
  for (i = 1; i < size; ++ i){
    stack = stack.next = new BlurStack();
  }
  stack.next = stackStart;

  pos = 0;

  for (y = 0; y < height; ++ y){
    start = pos;

    color = src[pos];
    sum = radius * color;

    stack = stackStart;
    for (i = 0; i < radius; ++ i){
      stack.color = color;
      stack = stack.next;
    }
    for (i = 1; i < radius; ++ i){
      stack.color = src[pos + i];
      sum += stack.color;
      stack = stack.next;
    }

    stack = stackStart;
    for (x = 0; x < width; ++ x){
      dst[pos ++] = (sum * mult) >>> shift;

      p = x + radius;
      p = start + (p < widthMinus1? p: widthMinus1);
      sum -= stack.color - src[p];

      stack.color = src[p];
      stack = stack.next;
    }
  }

  for (x = 0; x < width; ++ x){
    pos = x;
    start = pos + width;

    color = dst[pos];
    sum = radius * color;

    stack = stackStart;
    for (i = 0; i < radius; ++ i){
      stack.color = color;
      stack = stack.next;
    }
    for (i = 1; i < radius; ++ i){
      stack.color = dst[start];
      sum += stack.color;
      stack = stack.next;

      start += width;
    }

    stack = stackStart;
    for (y = 0; y < height; ++ y){
      dst[pos] = (sum * mult) >>> shift;

      p = y + radius;
      p = x + ( (p < heightMinus1? p: heightMinus1) * width );
      sum -= stack.color - dst[p];

      stack.color = dst[p];
      stack = stack.next;

      pos += width;
    }
  }

  return imageDst;
};

function countNonZero(imageSrc, square){
  var src = imageSrc.data, height = square.height, width = square.width,
      pos = square.x + (square.y * imageSrc.width),
      span = imageSrc.width - width,
      nz = 0, i, j;

  for (i = 0; i < height; ++ i){

    for (j = 0; j < width; ++ j){

      if ( 0 !== src[pos ++] ){
        ++ nz;
      }
    }

    pos += span;
  }

  return nz;
};


exports.findMarkers = findMarkers;