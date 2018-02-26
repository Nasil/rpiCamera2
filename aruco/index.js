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
const latency = require('./latency');

let cam = null;

// 고정값 변경 가능
const width = 320;
const height = 240;
const pixelTotal = 7;
const MAX_LOOP_CNT = 50000;

let times = [];

function bufConcat(a, b) {
    var result = new Buffer(a.length + b.length)
    a.copy(result);
    b.copy(result, a.length);
    return result;
}

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

    //console.log(cam.configGet());
    cam.start();

	let cnt = 0;
	cam.capture(function loop(sucess){
        let frame = cam.frameRaw();
        cnt++;

        // Greyscale Image Save
        //let fileName = 'imgGrey' + cnt + '.pgm';
        //fileWrite2Pgm(fileName, frame, "P5");

        // Binarized
        //const otsuFrame = otsu.otsu(frame, width, height);
        const binarized = binarizer.binarize(frame, width, height);

        // Marker detect
        //let startTime = Date.now();
        const detect = detector.detect(binarized.data, width, height, pixelTotal);
        if (detect !== false) console.log(detect);
        //let endTime = Date.now();
        //times.push(endTime - startTime);
        //if (cnt >= 100) {
        //    latency.latency(times, cnt);
        //    cnt = 0;
        //}

        //console.log(detect);

        //--- File write New ---
        //fileName = 'imgBinaryCorner_' + cnt + '.pgm';
        //fileWrite2Pgm(fileName, binarized.data, "P5");


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


main();
