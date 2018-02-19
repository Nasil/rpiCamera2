#!/usr/bin/env node

"use strict";

const binarizer = require("./binarizer");
const otsu = require("./otsu");
const detector = require("./detector");

const fs = require('fs');
const child = require('child_process');
const v4l2camera = require('.././v4l2camera');
const device = '/dev/video0';
const util = require('util');
const extend = require('util-extend');

const width = 320;
const height = 240;
const pixelTotal = 8;
const MAX_LOOP_CNT = 10;
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

	let cnt = 0;
	cam.capture(function loop(sucess){
    	let frame = cam.frameRaw();

		//--- File write Original ---
        cnt++;
		let fileName = 'imgGrey' + cnt + '.pgm';
        fileWrite2Pgm(fileName, frame, "P5");

        // Binarized
        //const otsuFrame = otsu.otsu(frame, width, height);
        const binarized = binarizer.binarize(frame, width, height);

        // Market read
        const detect = detector.detect(binarized.data, binarized.width, binarized.height, pixelTotal);

        //--- File write New ---
        fileName = 'img2_' + cnt + '.pgm';
        fileWrite2Pgm(fileName, binarized.data, "P5");

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

function set(x, y, value) {
  this.buf[y*this.width + x] = value
}

function get(x, y) {
  return this.buf[y*this.width + x]
}

main();
