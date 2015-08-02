'use strict';

var a = 42;

function change() {
  a++;
}

assert.equal(a, 42);
var exporter = a;

// Any replacement for the `export default` above needs to happen in the same
// location. It cannot be done, say, at the end of the file. Otherwise the new
// value of `a` will be used and will be incorrect.
a = 0;
assert.equal(a, 0);

assert.equal(exporter, 42);

change();
assert.equal(
  exporter,
  42,
  'default export should not be bound'
);