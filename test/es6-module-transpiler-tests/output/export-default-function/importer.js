'use strict';

var fn1 = require('./exporter');

assert.equal(fn1['default'](), 1);
assert.equal(fn1.default(), 1);