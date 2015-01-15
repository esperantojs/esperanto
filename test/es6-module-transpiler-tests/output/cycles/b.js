'use strict';

exports.geta = geta;

var a = require('./a');

function geta() {
  return a.a;
}

var b = 2;

exports.b = b;