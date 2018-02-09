#!/usr/bin/env node

'use strict';

const fs = require('fs');
const extractor_1 = require("./extractor");

let width = 320;
let height = 240;
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


function readImg(fileName) {
    console.log("=================" + fileName + "==============")
	let frame = fs.readFileSync(fileName);
    let bitmapSize = width * height;
    let frameBinary = new Uint8ClampedArray(bitmapSize);
    let length = frame.length;

    let startInx = length - (bitmapSize);
    let j = 0;
    
	for (var i = startInx; i < length; i++) {
        let val = (frame[i] === 255) ? 0 : 1;
        frameBinary[j] = val;
        j++;
    }

    return frameBinary;
}


const pixelTotal = 8;
let matrix;

function main(fileName) {

	// Read Image
	matrix = new Matrix(width, height, readImg(fileName));
    if (matrix.length < 0) {
        return;
    }

	// Find Point
	const location = findLocation();
    if (location == 1) {
        return;
    }

    // Location
    let location2 = {
        topLeft: { y: location.topLeft.x, x: location.topLeft.y },
        topRight: { y: location.topRight.x, x: location.topRight.y },
        bottomLeft: { y: location.bottomLeft.x, x: location.bottomLeft.y },
        bottomRight: { y: location.bottomRight.x, x: location.bottomRight.y},
        dimension: pixelTotal,
        pixelSize: location.pixelSize
    };
    const newMatrix = extractor_1.extract(matrix, location2);
    let data = [];
    for (let i = 0; i < pixelTotal; i++) {
        for(let j = 0; j < pixelTotal; j++) {
            data.push(newMatrix[i * pixelTotal + j]);
        }
        if(testResult(data, i)===false) {
            console.log('Error ' + i);
        }
        data = [];
    }

	// Decode
    //decode(location);
}

function findLocation() {
    let topRight = {x : height, y : width};
    let topLeft = {x : height, y : width};
    let bottomLeft = {x : 0, y : 0};
    let bottomRight = {x : 0, y : 0};
	let topDimension = 0;
    let sideDimension = 0;
    let pixelSize = 0;

    for (let i = 20; i < height-20; i++) {
        for (let j = 20; j < width-20; j++) {
            if (matrix.get(j, i) == 1) {
                if (topRight.x >= i ) {
                    topRight.x = i;
                    topRight.y = j;
                }
                if (topLeft.y >= j) {
                    topLeft.x = i;
                    topLeft.y = j;
                }
                if (bottomRight.y <= j && j < 230) {
                    bottomRight.x = i;
                    bottomRight.y = j;
                }
                if (bottomLeft.x <= i) {
                    bottomLeft.x = i;
                    bottomLeft.y = j;
                }
            }
        }
    }

    if (topRight.x == height || topRight.y == width ||
        topLeft.x == height || topLeft.y == width ||
        bottomRight.x == 0 || bottomRight.y == 0||
        bottomLeft.x == 0 || bottomLeft.y == 0) {
        console.log("Outer out");
        return false;
    }

	topDimension = distance(topLeft, topRight);
    sideDimension = distance(topLeft, bottomLeft);
    pixelSize = Math.max(Math.floor(topDimension/pixelTotal), Math.floor(sideDimension/pixelTotal));
    
    if (Math.abs(topDimension - sideDimension) > pixelSize) {
        console.log("Outer out");
        return false;
    }

    
    let location = {
        topLeft: { x: topLeft.x, y: topLeft.y },
        topRight: { x: topRight.x, y: topRight.y },
        bottomLeft: { x: bottomLeft.x, y: bottomLeft.y },
        bottomRight: { x: bottomRight.x, y: bottomRight.y},
        dimension: pixelTotal,
        pixelSize
    }


    return location;
}

function decode(location) {

    let data = [];
	let cnt = 0;

    const pixelSize = location.pixelSize;
	const startX = Math.min(location.topLeft.x, location.topRight.x);
    const startY = Math.min(location.topLeft.y, location.bottomLeft.y);
    const endX = Math.max(location.bottomLeft.x,location.bottomRight.x);
    const endY = Math.max(location.topRight.y,location.bottomRight.y);

    for (let i = startX; i < endX; i++) {
        for (let j = startY; j < endY; j++) {
            // Bitmap Find
            let sum = 0;
            let min = Infinity;
            let max = 0;
            for (let y = 0; y < pixelSize; y++) {
                for (let x =0; x < pixelSize; x++) {
                    const pixelLum = matrix.get(j+x, i+y);
                    sum += pixelLum;
                }
            }
            j = j + pixelSize;

            // Get Pixcel average data
            let average = sum / (Math.pow(pixelSize, 2));
            let setPixel = (average < 0.5) ? 0 : 1;
            data.push(setPixel);
        }

        if (data.length != pixelTotal) {
            console.log("Column Size Error :" + data.length);
            return;
        }
        if (cnt == pixelTotal) {
            console.log("Row Size Error :" + cnt);
            return;
        }

		if (testResult(data, cnt) == false) {
			console.log('Error ' + cnt );
		}
		
        cnt++;
        console.log(data);
        data =[];
        i = i + pixelSize;
    }
}

var correctBitMatrix = [ 
	[1, 1, 1, 1, 1, 1, 1, 1],
	[1, 0, 0, 1, 0, 1, 0, 1],
	[1, 0, 0, 1, 0, 1, 0, 1],
	[1, 1, 1, 0, 0, 1, 1, 1],
	[1, 0, 0, 1, 0, 0, 1, 1],
	[1, 0, 0, 0, 0, 0, 0, 1],
	[1, 1, 1, 1, 1, 0, 1, 1],
	[1, 1, 1, 1, 1, 1, 1, 1] 
]



function testResult(data, index){
    if (index > pixelTotal-1) return false;
    for (let i = 0 ; i < data.length; i++) {
		if (correctBitMatrix[index][i] != data[i]) {
			return false;
		}
	}
	return true;
}

//main('./image/imgBinary2.pgm');
//main('./image/imgBinary3.pgm');
//main('./image/imgBinary4.pgm');
//main('./image/imgBinary5.pgm');
//main('./image/imgBinary6.pgm');


main('./image/imgBinaryLeft5.pgm');
//main('./image/imgBinary7.pgm');
//main('./image/imgBinary8.pgm');
//main('./image/imgBinary9.pgm');
//main('./image/imgBinary10.pgm');

//main('./image/imgBinaryOuter6.pgm');
