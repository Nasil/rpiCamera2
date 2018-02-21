"use strict";

class bitMatrix {
    static createEmpty(width, height) {
        return new bitMatrix(new Uint8ClampedArray(width * height), width);
    }
    constructor(data, width) {
        this.width = width;
        this.height = data.length / width;
        this.data = data;
    }
    get(x, y) {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
            return false;
        }
        return this.data[y * this.width + x];
    }
    setGrey(x, y, v) {
        this.data[y * this.width + x] = v ? 255 : 0;
    }
    set(x, y, v) {
        this.data[y * this.width + x] = v ? 1 : 0;
    }
    setRegion(left, top, width, height, v) {
        for (let y = top; y < top + height; y++) {
            for (let x = left; x < left + width; x++) {
                this.set(x, y, v);
            }
        }
    }
}

exports.bitMatrix = bitMatrix;
