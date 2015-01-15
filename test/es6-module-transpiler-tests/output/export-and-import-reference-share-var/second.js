'use strict';

var first = require('./first');

var a_ = first.a, b = 9, c = 'c';

assert.equal(first.a, 1);
assert.equal(a_, 1);
assert.equal(b, 9);
assert.equal(c, 'c');

exports.b = b;