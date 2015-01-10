'use strict';

function foo() {
  return 1;
}

function callsFoo() {
  return foo();
}

assert.strictEqual(foo(), 1);
assert.strictEqual(callsFoo(), 1);