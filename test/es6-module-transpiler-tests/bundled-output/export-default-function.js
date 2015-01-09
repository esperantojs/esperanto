'use strict';

/* jshint esnext:true */

var fn1 = function () {
  return 1;
}

/* jshint esnext:true */

assert.equal(fn1(), 1);
assert.equal(fn1(), 1);