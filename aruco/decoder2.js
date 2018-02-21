"use strict";

const BitMatrix_1 = require("./BitMatrix");

function countNonZero(matrix, square){
    let src = matrix.data, height = square.height, width = square.width,
        pos = square.x + (square.y * matrix.width),
        span = matrix.width - width,
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

function hammingDistance(bits){
    let ids = [ [1,0,0,0,0], [1,0,1,1,1], [0,1,0,0,1], [0,1,1,1,0] ], // 16, 23, 9, 14
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

function rotate(src){
    let dst = [], len = src.length, i, j;
    for (i = 0; i < len; ++ i){
        dst[i] = [];
        for (j = 0; j < src[i].length; ++ j){
            dst[i][j] = src[src[i].length - j - 1][i];
        }
    }

    return dst;
};

function readId(bits, pixelTotal) {
    var id = 0, i, bitOne = 1, bitTwo = 3;

    for (i = 0; i < pixelTotal; ++ i){
        id <<= 1;
        id |= bits[i][bitOne];
        id <<= 1;
        id |= bits[i][bitTwo];
    }

    return id;
}

function decode(matrix, pixelTotal){
    let width = (matrix.width / pixelTotal) >>> 0,
        minZero = (width * width) >> 1,
        bits = [], rotateList = [], distances = [],
        square, pair, inc, i, j, dataSize = pixelTotal - 2;

    // 테두리 전체가 0 인지 확인
    for (i = 0; i < pixelTotal; ++ i){
        inc = (0 === i || (pixelTotal-1) === i)? 1: (pixelTotal-1);
        for (j = 0; j < pixelTotal; j += inc){
            square = {x: j * width, y: i * width, width: width, height: width};
            if (countNonZero(matrix, square) > minZero){
                return null;
            }
        }
    }

    // 테두리를 제외한 데이터를 5 * 5 배열에 0 과 1 로 표현
    for (i = 0; i < dataSize; ++ i){
        bits[i] = [];
        for (j = 0; j < dataSize; ++ j){
            square = {x: (j + 1) * width, y: (i + 1) * width, width: width, height: width};
            bits[i][j] = countNonZero(matrix, square) > minZero? 1: 0;
        }
    }

    // 각도 구하기
    rotateList[0] = bits;
    distances[0] = hammingDistance( rotateList[0] );
    let shortDistance = distances[0];
    let angleIdx = 0;
    for (i = 1; i < 4; ++ i){
        rotateList[i] = rotate( rotateList[i - 1] );
        distances[i] = hammingDistance( rotateList[i] );
        if (distances[i] < shortDistance){
            shortDistance = distances[i]; // 제일 짧은 거리
            angleIdx = i; // 제일 짧은거리의 순번
        }
    }

    if (0 !== shortDistance){
        return false;
    }

    // 반시계 방향 :  (4-angleIdx) * 90
    // 시계 방향 :  angleIdx * 90
    return {angle: angleIdx * 90, id: readId(rotateList[angleIdx], pixelTotal-2)};
};

exports.decode = decode;
