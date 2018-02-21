'use strict';

let maxSum = 0.;
let thresholds = [];

function createImg(frame, width, height) {
	return {
		width : width,
		height : height,
		data : frame
	}
}

function histogram(image) {
    let histogram = new Uint8ClampedArray(256);

    let maxCnt = image.width * image.height;
    for (let i = 0; i < maxCnt; i++) {
        let luma = image.data[i];
        histogram[luma]++;
    }

    for (let i = 0; i < histogram.length; i++) {
        histogram[i]++;
    }

    return histogram;
}

function for_loop(H, u, vmax, level, levels, index)
{
    var classes = index.length - 1;

    for (var i = u; i < vmax; i++) {
        index[level] = i;

        if (level + 1 >= classes) {
            // Reached the end of the for loop.

            // Calculate the quadratic sum of al intervals.
            var sum = 0.;

            for (var c = 0; c < classes; c++) {
                var u = index[c];
                var v = index[c + 1];
                var s = H[v + u * levels];
                sum += s;
            }

            if (maxSum < sum) {
                // Return calculated threshold.
                thresholds = index.slice(1, index.length - 1);
                maxSum = sum;
            }
        } else
            // Start a new for loop level, one position after current one.
            for_loop(H,
                    i + 1,
                    vmax + 1,
                    level + 1,
                    levels,
                    index);
    }
}

function buildTables(histogram)
{
    // Create cumulative sum tables.
    var P = new Array(histogram.length + 1);
    var S = new Array(histogram.length + 1);
    P[0] = 0;
    S[0] = 0;

    var sumP = 0;
    var sumS = 0;

    for (var i = 0; i < histogram.length; i++) {
        sumP += histogram[i];
        sumS += i * histogram[i];
        P[i + 1] = sumP;
        S[i + 1] = sumS;
    }

    // Calculate the between-class variance for the interval u-v
    var H = new Array(histogram.length * histogram.length);
    H.fill(0.);

    for (var u = 0; u < histogram.length; u++)
        for (var v = u + 1; v < histogram.length; v++)
            H[v + u * histogram.length] = Math.pow(S[v] - S[u], 2) / (P[v] - P[u]);

    return H;
}

function otsuExec(histogram, classes)
{
    maxSum = 0.;
    thresholds = new Uint8ClampedArray(classes - 1);
    let H = buildTables(histogram);
    let index = new Uint8ClampedArray(classes + 1);
    index[0] = 0;
    index[index.length - 1] = histogram.length - 1;

    for_loop(H,
            1,
            histogram.length - classes + 1,
            1,
            histogram.length,
            index);

    return thresholds;
}

function otsu(frame, width, height)
{
    console.time('otsu time ');
	let img = createImg(frame, width, height);
    let hist = histogram(img);

    let classes = 2;
    let thresholds = otsuExec(hist, classes);
	
    console.log(thresholds);

    var dstData = img.data;
    var colors = new Uint8ClampedArray(classes);
    for (var i = 0; i < classes; i++)
        colors[i] = Math.round(255 * i / (classes - 1));

    var colorTable = new Uint8ClampedArray(256);
    var j = 0;

    for (var i = 0; i < colorTable.length; i++) {
        if (j < thresholds.length && i >= thresholds[j])
            j++;

        colorTable[i] = colors[j];
    }

    for (var i = 0; i < dstData.length; i++) {
        var luma = (  11 * dstData[i]
                    + 16 * dstData[i + 1]
                    +  5 * dstData[i + 2]) >> 5;
        luma = colorTable[luma];

        dstData[i]     = luma;
    }


    console.timeEnd('otsu time ');
	return dstData;
}


exports.otsu = otsu;
