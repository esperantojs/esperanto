'use strict';

var a = require('./a');
var b = require('./b');

assert.equal(b.geta(), 1);
assert.equal(a.a, 1);
assert.equal(a.getb(), 2);
assert.equal(b.b, 2);