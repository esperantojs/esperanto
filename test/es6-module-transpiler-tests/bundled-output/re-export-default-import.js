'use strict';

function hi() {
  return 'hi';
}

/* jshint esnext:true */

assert.equal(hi(), 'hi');