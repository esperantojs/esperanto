'use strict';

var a = 1;

var importer__getA = function getA() {
  var a = 2;
  return a;
};

assert.strictEqual(a, 1);
assert.strictEqual(importer__getA(), 2);