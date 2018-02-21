#!/usr/bin/env node

'use strict';

const fs = require('fs');
const Extractor = require("./extractor");
const Locator = require("./locator");
const Decoder = require("./decoder");
let matrix;

const distance = (a, b) => Math.sqrt(Math.pow((b.x - a.x), 2) + Math.pow((b.y - a.y), 2));

class Matrix {
  constructor(width, height, data) {
    this.width = width;
    this.height = height;
    this.data = data;
  }
  get(x, y) {
    return this.data[y * this.width + x];
  }
  set(x, y, value) {
    this.data[y * this.width + x] = value;
  }
}

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
    let i, markerMatrix, markerData, markers = [], markerMatrixs = [];
    //matrix = new Matrix(width, height, readImg(data, width, height));
    matrix = new Matrix(width, height, data);
    if (matrix.length < 0) {
        return;
    }

    // Find Corner Point
    const location = Locator.location(matrix, pixelTotal);

    // Extract & Read
    for (let i = 0; i < location.length; i++) {
        markerMatrixs = Extractor.extract(matrix, location[i], pixelTotal, true);
        for (let j = 0; j < markerMatrixs.length; j++) {
            markerData = Decoder.decode(markerMatrixs[j], pixelTotal);
            if (markerData !== false) {
                //view(markerMatrixs[0].data);
                console.log(markerData);
                return markerData;
            }
        }
    }

    return false;
}

function view(matrix) {
    let data = [];
    for (let i = 0 ; i < 7; i++) {
        for (let j = 0; j < 7; j++) {
            data.push(matrix[i * 7 + j]);
        }
        console.log(data);
        data = [];
    }
}

// TO-DO For Testthreshold
//detect('./image/imgBinary3_7.pgm', 320, 240, 7);
//detect('./image/imgBinary2_7.pgm', 320, 240, 7);
//detect('./image/imgBinary5_7.pgm', 320, 240, 7);

exports.detect = detect;
