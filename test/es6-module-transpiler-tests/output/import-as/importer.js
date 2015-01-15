'use strict';

var exporter = require('./exporter');

assert.equal(exporter.a, 'a');
assert.equal(exporter.b, 'b');
assert.equal(exporter.default, 'DEF');