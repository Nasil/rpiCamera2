#!/usr/bin/env node

'use strict';

const fs = require('fs');
const Extractor = require("./extractor");
const Locator = require("./locator");
const Decoder = require("./decoder");
const BitMatrix = require("./bitMatrix");

const distance = (a, b) => Math.sqrt(Math.pow((b.x - a.x), 2) + Math.pow((b.y - a.y), 2));

function readImg(fileName, width, height) {
    console.log("=================" + fileName + "==============")
    const frame = fs.readFileSync(fileName);
    const bitmapSize = width * height;
    const frameBinary = new Uint8ClampedArray(bitmapSize);
    const length = frame.length;
    const startInx = length - (bitmapSize);
    let i, j = 0, val;

    for (i = startInx; i < length; i++) {
        val = (frame[i] === 255) ? 1 : 0;
        frameBinary[j] = val;
        j++;
    }

    return frameBinary;
}

function detect(data, width, height, pixelTotal) {
    let i, j, matrix, location, markerMatrix, markerData, markers = [], markerMatrixs = [];

    //matrix = new BitMatrix.bitMatrix(readImg(data, width, height), width, height);
    matrix = new BitMatrix.bitMatrix(data, width, height);
    if (matrix.length < 0) {
        return false;
    }

    // Find Corner Point
    location = Locator.location(matrix, pixelTotal);
    if (location.length < 0) {
        return false;
    }

    // Extract & Read Marker
    for (i = 0; i < location.length; i++) {
        markerMatrixs = Extractor.extract(matrix, location[i], pixelTotal, false);
        for (j = 0; j < markerMatrixs.length; j++) {
            markerData = Decoder.decode(markerMatrixs[j], pixelTotal, location[i]);
            if (markerData !== false) {
                console.log(location[i]);
                return markerData;
            }
        }
    }

    return false;
}

// TO-DO For Test
//detect('./image/imgBinary_7.pgm', 320, 240, 7);
//detect('./image/imgBinary1_7.pgm', 320, 240, 7);

exports.detect = detect;
