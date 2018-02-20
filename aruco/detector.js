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
    let i, markerMatrix, id;
    //matrix = new Matrix(width, height, readImg(data, width, height));
    matrix = new Matrix(width, height, data);
    if (matrix.length < 0) {
        return;
    }

    // Find Corner Point
    console.time("Location time ");
    const location = Locator.location(matrix, pixelTotal);

    // Extract
    for (let i = 0; i < location.length; i++) {
        markerMatrix = Extractor.extract(matrix, location[i]);
        id = Decoder.decode(markerMatrix, pixelTotal);
        console.log(id);
    }


    console.timeEnd("Location time ");
    return id;
}

// TO-DO For Test
//detect('./image/img2_3.pgm', 320, 240, 7);

exports.detect = detect;
