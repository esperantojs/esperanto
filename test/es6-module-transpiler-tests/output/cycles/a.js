'use strict';

exports.getb = getb;

var b = require('./b');

function getb() {
  return b.b;
}

var a = 1;

exports.a = a;