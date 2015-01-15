'use strict';

var a = require('./a');
var b = require('./b');

assert.equal(a['default'].a, 1);
assert.equal(a['default'].b, 2);
assert.equal(b['default'].a, 1);
assert.equal(b['default'].b, 2);