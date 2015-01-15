'use strict';

exports.incr = incr;

var count = 0;

function incr() {
  count++, exports.count = count;
}

exports.count = count;