'use strict';

exports.foo = foo;

function foo() {
  return 121;
}
assert.equal(foo(), 121);