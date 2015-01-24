'use strict';

exports.isEven = isEven;

var odds = require('./odds');

var nextEven = (function() {
  return function(n) {
    var no = odds.nextOdd(n);
    return (no === n + 2) ?
      no - 1 : no;
  };
})(odds.nextOdd);

function isEven(n) {
  return n % 2 === 0;
}

exports.nextEven = nextEven;