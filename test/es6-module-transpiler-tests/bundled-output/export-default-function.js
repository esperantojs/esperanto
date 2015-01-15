'use strict';

var fn1 = function () {
  return 1;
}

assert.equal(fn1(), 1);
assert.equal(fn1(), 1);