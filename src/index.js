#!/usr/bin/env node

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });

const binarizer_1 = require("./binarizer");
const decoder_1 = require("./decoder/decoder");
const extractor_1 = require("./extractor");
const locator_1 = require("./locator");
const fs = require('fs');
const child = require('child_process');
const jpeg = require('jpeg-js');
const v4l2camera = require('.././v4l2camera');
const device = '/dev/video0';

const width = 320;
const height = 240;


let cam = null;

function main() {

    try {
    	cam = new v4l2camera.Camera(device);
	} catch (err) {
    	console.log('v4l2camera error');
    	process.exit(1);
	}

    if (cam) {
	    console.log('open camera device:' + device);
    }

	cam.configSet({
        width:width,
        height:height
    });

    console.log(cam.configGet());

    cam.start();

	let oldTime = 0;
	let cnt = 0;
	cam.capture(function loop(sucess){
    	var frame = cam.frameRaw();
    	//var frame = cam.toRGB();
    	//console.log(frame.length);
        
        //--- QR decode ---
        //var qrData = qrReader(frame, cam.width, cam.height);
        //console.log(qrData);

        //--- File write ---
        //cnt++;
        //let fileName = 'imgGrey' + cnt + '.pgm';
        //fs.writeFileSync('./image/' + fileName, frame);
    	//console.log(fileName);

        //--- Time Check ---
    	let newTime = new Date().getTime();
    	console.log(newTime - oldTime);
    	oldTime = newTime;

    	cam.capture(loop);
    	//process.exit(1);
	});
}

function qrReader(data, width, height) {
    const binarized = binarizer_1.binarize(data, width, height);
    console.log(binarized.length);
    const location = locator_1.locate(binarized);
    if (!location) {
        return console.log('Location Error');
    }
    const extracted = extractor_1.extract(binarized, location);
    const decoded = decoder_1.decode(extracted.matrix);
    if (!decoded) {
        return console.log('Decoded Error');
    }
    return {
        binaryData: decoded.bytes,
        data: decoded.text,
        chunks: decoded.chunks,
        location: {
            topRightCorner: extracted.mappingFunction(location.dimension, 0),
            topLeftCorner: extracted.mappingFunction(0, 0),
            bottomRightCorner: extracted.mappingFunction(location.dimension, location.dimension),
            bottomLeftCorner: extracted.mappingFunction(0, location.dimension),
            topRightFinderPattern: location.topRight,
            topLeftFinderPattern: location.topLeft,
            bottomLeftFinderPattern: location.bottomLeft,
            bottomRightAlignmentPattern: location.alignmentPattern,
        },
    };
}

main();
