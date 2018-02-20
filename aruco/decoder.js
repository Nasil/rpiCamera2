"use strict";

const Dictionary = require("./dictionary");

function decode(matrix, pixelTotal) {
    let data = []

    // TO-DO 검증용
    for (let i = 0; i < pixelTotal; i++) {
        for (let j = 0; j < pixelTotal; j++) {
            data.push(matrix.get(j,i));
        }
        console.log(data);
        data = [];
    }

    // dictionary 값 대로 읽기
	let id = readId(matrix.data, pixelTotal);

    return id;
}

function findDictionaray(data) {

    //console.log(data);

    let dictionary = Dictionary.getDictionary();
    let maxLength = dictionary.length, angleLength = 4;

    for (let i = 0; i < maxLength; i++) {
        for (let j = 0; j < angleLength; j++) {
            if (dictionary[i][j][0] == data[0] && dictionary[i][j][1] == data[1]) {
                if (dictionary[i][j][2] == data[2] && dictionary[i][j][3] == data[3]) {
                    //console.log(process.memoryUsage());
                    return {angle: j * 90, id: i};
                }
            }
        }
    }


	return false;
}

function readId(bits, pixelTotal) {
    let id = 0, bitData = [], i, j, cnt = 0;

    for (i = 1; i < pixelTotal-1; ++i) {
        for (j = 1; j < pixelTotal-1; ++j) {
            id <<= 1;
            let bit = bits[i * pixelTotal + j];  
            id != bit;
            cnt++;
            if (cnt == 8) {
                cnt = 0;
                bitData.push(id);
                id = 0;
            }
        }
    }

    bitData.push(bits[bits.length - (pixelTotal + 2)]);

    return findDictionaray(bitData);
}

exports.decode = decode;
