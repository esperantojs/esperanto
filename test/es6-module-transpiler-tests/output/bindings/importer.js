'use strict';

var exporter = require('./exporter');

assert.equal(exporter.count, 0);
exporter.incr();
assert.equal(exporter.count, 1);