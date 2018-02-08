#!/usr/bin/env node

'use strict';

const fs = require('fs');
const makesquire_1 = require('./makeSqure');

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


let topRight = {x : height, y : width};
let topLeft = {x : height, y : width};
let bottomLeft = {x : 0, y : 0};
let bottomRight = {x : 0, y : 0};
const pixelTotal = 8;
let topDimension = 0;
let sideDimension = 0;
let dimension = 0;
let matrix;

function main(fileName) {
	matrix = new Matrix(width, height, readImg(fileName));
    findPoint();
    //extract();
    decode();
}

function findPoint() {
    for (let i = 0; i < height; i++) {
        for (let j = 0; j < width; j++) {
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

	topDimension = Math.floor(distance(topLeft, topRight) / pixelTotal);
    sideDimension = Math.floor(distance(topLeft, bottomLeft) / pixelTotal);
    dimension = Math.max(topDimension, sideDimension);

}

function extract() {
	const bottomRightFinderPattern = {
        x: topRight.x - topLeft.x + bottomLeft.x,
        y: topRight.y - topLeft.y + bottomLeft.y,
    };
    const modulesBetweenFinderPatterns = ((distance(topLeft, bottomLeft) + distance(topLeft, topRight)) / 2 / moduleSize);

    const correctionToTopLeft = 1 - (3 / modulesBetweenFinderPatterns);
    const expectedAlignmentPattern = {
        x: topLeft.x + correctionToTopLeft * (bottomRightFinderPattern.x - topLeft.x),
        y: topLeft.y + correctionToTopLeft * (bottomRightFinderPattern.y - topLeft.y),
    };
 

    let location = {
        alignmentPattern: { x: alignmentPattern.x, y: alignmentPattern.y },
        bottomLeft: { x: bottomLeft.x, y: bottomLeft.y },
        dimension,
        topLeft: { x: topLeft.x, y: topLeft.y },
        topRight: { x: topRight.x, y: topRight.y },
    }

    console.log(location);
    //makesqure_1.extract();
}

function decode() {

    let data = [];
	let cnt = 0;

	let startX = Math.min(topLeft.x, topRight.x);
    let startY = Math.min(topLeft.y, bottomLeft.y);
    let endX = Math.max(bottomLeft.x, bottomRight.x);
    let endY = Math.max(topRight.y, bottomRight.y);

    for (let i = startX; i < endX; i++) {
        for (let j = startY; j < endY; j++) {
            // Bitmap Find
            let sum = 0;
            let min = Infinity;
            let max = 0;
            for (let y = 0; y < dimension; y++) {
                for (let x =0; x < dimension; x++) {
                    const pixelLum = matrix.get(j+x, i+y);
                    sum += pixelLum;
                }
            }
            j = j + dimension;

            // Get Pixcel average data
            let average = sum / (Math.pow(dimension, 2));
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
        i = i + dimension;
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

main('./image/imgBinary2.pgm');
main('./image/imgBinary3.pgm');
main('./image/imgBinary4.pgm');
main('./image/imgBinary5.pgm');
main('./image/imgBinary6.pgm');
main('./image/imgBinary7.pgm');
main('./image/imgBinary8.pgm');
main('./image/imgBinary9.pgm');
main('./image/imgBinary10.pgm');

