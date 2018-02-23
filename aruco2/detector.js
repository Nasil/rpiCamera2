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
    let frame = fs.readFileSync(fileName);
    let bitmapSize = width * height;
    let frameBinary = new Uint8ClampedArray(bitmapSize);
    let length = frame.length;
    let startInx = length - (bitmapSize);
    let j = 0;

    for (var i = startInx; i < length; i++) {
        let val = (frame[i] === 255) ? 1 : 0;
        frameBinary[j] = val;
        j++;
    }

    return frameBinary;
}

function detect(data, width, height, pixelTotal) {
    let i, matrix, markerMatrix, markerData, markers = [], markerMatrixs = [];
    //matrix = new BitMatrix.bitMatrix(readImg(data, width, height), width, height);
    matrix = new BitMatrix.bitMatrix(data, width, height);
    if (matrix.length < 0) {
        return;
    }

    // Find Corner Point
    const location = Locator.location(matrix, pixelTotal);

    // Extract & Read
    for (let i = 0; i < location.length; i++) {
        markerMatrixs = Extractor.extract(matrix, location[i], pixelTotal, false);
        for (let j = 0; j < markerMatrixs.length; j++) {
            markerData = Decoder.decode(markerMatrixs[j], pixelTotal);
            if (markerData !== false) {
                //console.log(markerData);
                return markerData;
            }
        }
    }

    return false;
}

// TO-DO For Test
//detect('./image/imgBinary3_7.pgm', 320, 240, 7);
//detect('./image/imgBinary2_7.pgm', 320, 240, 7);
//detect('./image/imgBinary5_7.pgm', 320, 240, 7);

exports.detect = detect;
