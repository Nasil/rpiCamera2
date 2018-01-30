'use strict'

const Splitter = require('stream-split');
const stream = require('stream');
const StreamConcat = require('stream-concat');
const child = require('child_process');

const NALseparator = new Buffer([0,0,0,1]);

const headerData = {
    _waitingStream: new stream.PassThrough(),
    _firstFrames: [],
    _lastIdrFrame: null,

    set idrFrame(frame) {
        this._lastIdrFrame = frame;

        if (this._waitingStream) {
            const waitingStream = this._waitingStream;
            this._waitingStream = null;
            this.getStream().pipe(waitingStream);
        }
    },

    addParameterFrame: function (frame) {
        this._firstFrames.push(frame)
    },

    getStream: function () {
        if (this._waitingStream) {
            return this._waitingStream;
        } else {
            const headersStream = new stream.PassThrough();
            this._firstFrames.forEach((frame) => headersStream.push(frame));
            headersStream.push(this._lastIdrFrame);
            headersStream.end();
            return headersStream;
        }
    }
};

function raspivid(options){
  options = options || {};

  var args = [];

  Object.keys(options || {}).forEach(function(key){
    args.push('--' + key);
    var val = options[key];
    if (val || val === 0) {
      args.push(val);
    }
  });

  args.push('-o');
  args.push('-');

  var video_process = child.spawn('raspivid', args, {
    stdio: ['ignore', 'pipe', 'inherit']
  });

  return video_process.stdout;
}

function getLiveStream(options) {
    return raspivid(Object.assign(options))
    .pipe(new Splitter(NALseparator))
    .pipe(new stream.Transform({ transform: function (chunk, encoding, callback) {
        const chunkWithSeparator = Buffer.concat([NALseparator, chunk]);

        const chunkType = chunk[0] & 0b11111;

        if (chunkType === 7 || chunkType === 8) {
            headerData.addParameterFrame(chunkWithSeparator);
        } else {
            this.push(chunkWithSeparator);
            if (chunkType === 5) {
                headerData.idrFrame = chunkWithSeparator;
            }
        }

        callback();
    }}));
}

var liveStream = null;

module.exports = function (options) {
    if (!liveStream) {
        liveStream = getLiveStream(options);
    }

    return new StreamConcat([headerData.getStream(), liveStream]);
}
