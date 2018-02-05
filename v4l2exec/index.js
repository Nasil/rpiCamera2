#!/usr/bin/env node

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });

const binarizer_1 = require("./binarizer2");
//const binarizer_1 = require("./binarizer");
const decoder_1 = require("./decoder/decoder");
const extractor_1 = require("./extractor");
const locator_1 = require("./locator");
const fs = require('fs');
const child = require('child_process');
const jpeg = require('jpeg-js');
const v4l2camera = require('.././v4l2camera');
const device = '/dev/video0';
const util = require('util');
const extend = require('util-extend');

const width = 320;
const height = 240;
const MAX_LOOP_CNT = 30;

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

	let oldTime = nowDate();
	let cnt = 0;
	cam.capture(function loop(sucess){
    	var frame = cam.frameRaw();
        //console.log(frame);
        
        //--- QR decode ---
        var qrData = qrReader(frame, cam.width, cam.height);
        console.log(qrData);

        //--- File write Original  ---
        cnt++;
        let fileName = 'imgGrey' + cnt + '.pgm';
		fileWrite2Pgm(fileName, frame, "P5");
        
        //--- Time Check ---
    	let newTime = nowDate();
    	console.log("총 시간 : " + (newTime - oldTime));
    	oldTime = newTime;

        if (cnt == MAX_LOOP_CNT) { 
            process.exit(1);
        }

    	cam.capture(loop);
	});
}

function fileWrite2Pgm(fileName, frame, imgType)
{
    let header = "";
    if (imgType == "P5" || imgType == "P2") {
        header =  imgType + "\n" + "320 240\n" +"255\n";
    }
    if (imgType == "P4" || imgType == "P1") {
        header =  imgType + "\n" + "320 240\n";
    }

    let bufPgm = bufConcat(new Buffer(header), new Buffer(frame));
    fs.writeFileSync('./image/' + fileName, bufPgm);
	console.log("File Save : " + fileName);
}


// === helpers ===
function bufEq(a, b) {
  if (a.length !== b.length) return false
  for (var i=0; i<a.length; i++)
    if (a[i] !== b[i]) return false
  return true
}

function indexOf(arraylike, target, needed) {
  for (var i=0; i<arraylike.length; i++)
    if (arraylike[i] === target)
      return i
  if (needed)
    throw new Error('needed thing not found')
  return -1
}

function char(str) {
  return str.charCodeAt(str)
}

function bufConcat(a, b) {
  var result = new Buffer(a.length + b.length)
  a.copy(result);
  b.copy(result, a.length);
  return result;
}

function Image(data, width, height, maxcolor) {
  this.data = data;
  this.width = width;
  this.height = height;
  this.maxcolor = maxcolor;
}

function set(x, y, value) {
  this.buf[y*this.width + x] = value
}

function get(x, y) {
  return this.buf[y*this.width + x]
}


function qrReader(data, width, height) {

    // Binarized 
	var oldTime = nowDate();
    const binarized = binarizer_1.binarize(data, width, height);
    console.log("binarized :" + (nowDate() - oldTime));
    oldTime = nowDate();
    
	//let fileName = 'binary1.pgm';
    //fileWrite2Pgm(fileName, binarized.data, "P2");

	//let fileName2 = 'binary2.pbm';
    //fileWrite2Pgm(fileName2, binarized.data, "P1");

    // Locate
    const location = locator_1.locate(binarized);
    if (!location) {
        return console.log('Location Error');
    }
    console.log("lacate : " + (nowDate() - oldTime));
    oldTime = nowDate();

    // Extract
    const extracted = extractor_1.extract(binarized, location);
	console.log("Extract : " + (nowDate() - oldTime));
    oldTime = nowDate();
    
    //Decode 
	const decoded = decoder_1.decode(extracted.matrix);
    if (!decoded) {
        return console.log('Decoded Error');
    }
    console.log("Decod : " + (nowDate() - oldTime));

    return {
        data: decoded.text,
        chunks: decoded.chunks,
        location: {
            //topRightCorner: extracted.mappingFunction(location.dimension, 0),
            //bottomRightCorner: extracted.mappingFunction(location.dimension, location.dimension),
            //bottomLeftCorner: extracted.mappingFunction(0, location.dimension),
            topRightFinderPattern: location.topRight,
            topLeftFinderPattern: location.topLeft,
            bottomLeftFinderPattern: location.bottomLeft,
            //bottomRightAlignmentPattern: location.alignmentPattern,
        },
    };
}


function nowDate() {
    return new Date().getTime();
}

//qrImgRead();
main();
