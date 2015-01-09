'use strict';

var exporter = require('./exporter');

var getA = function getA() {
  var a = 2;
  return a;
};

assert.strictEqual(exporter.a, 1);
assert.strictEqual(getA(), 2);