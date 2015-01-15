'use strict';

var count = 0;

function incr() {
  count++;
}

assert.equal(count, 0);
incr();
assert.equal(count, 1);