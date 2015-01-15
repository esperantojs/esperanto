'use strict';

var a = 1;

/* error: type=SyntaxError message="expected one declaration for `a`, at importer.js:5:14 but found 2" */
assert.equal(a, 1);