"use strict";

const co = require('co')

function latency(times) {
    latencyExec(times, times.length).then(function (val) {
        console.log(val);
    });
}

const latencyExec = co.wrap(function *(times, n) {
  n = n || 50

  const sigma = stdev(times)
  const mu = mean(times)

  return {
    count: n,
    //times,
    mean: mu,
    min: Math.min.apply(null, times),
    max: Math.max.apply(null, times),
    stdev: sigma,
    p95: p95(mu, sigma),
    p99: p99(mu, sigma)
  }
})

function mean (list) {
  return list.reduce((acc, item) => acc + item, 0) / list.length
}

function p95 (mu, sigma) {
  const z = 1.645
  return percentile(z, mu, sigma)
}

function p99 (mu, sigma) {
  const z = 2.326
  return percentile(z, mu, sigma)
}

function percentile (z, mu, sigma) {
  return z * sigma + mu
}

function stdev( arr ) {
    if ( !Array.isArray( arr ) ) {
        throw new TypeError( 'stdev()::invalid input argument. Must provide an array.' );
    }

    var len = arr.length,
      N = 0,
      mean = 0,
      M2 = 0,
      delta = 0;

    if ( len < 2 ) {
      return 0;
    }

    for ( var i = 0; i < len; i++ ) {
        N += 1;
        delta = arr[ i ] - mean;
        mean += delta / N;
        M2 += delta * ( arr[i] - mean );
    }

    return Math.sqrt( M2 / ( N-1 ) );
}

exports.latency = latency;
