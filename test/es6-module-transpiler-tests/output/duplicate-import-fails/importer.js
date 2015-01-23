'use strict';

var exporter = require('./exporter');

/* error: type=SyntaxError message="expected one declaration for `a`, at importer.js:7:14 but found 2" */
assert.equal(exporter.a, 1);