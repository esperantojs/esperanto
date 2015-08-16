'use strict';

var a = 1;
assert.equal(a, 1);

var a_ = a;
exports.b = 9;
var c = 'c';
assert.equal(a, 1);
assert.equal(a_, 1);
assert.equal(exports.b, 9);
assert.equal(c, 'c');