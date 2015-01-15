'use strict';

exports.change = change;

var a = 42;

function change() {
  a++;
}

assert.equal(a, 42);
exports['default'] = a;

// Any replacement for the `export default` above needs to happen in the same
// location. It cannot be done, say, at the end of the file. Otherwise the new
// value of `a` will be used and will be incorrect.
a = 0;
assert.equal(a, 0);