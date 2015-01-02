(function () {

  'use strict';

  /* jshint esnext:true */

  var count = 0;

  function incr() {
    count++;
  }

  /* jshint esnext:true */

  assert.equal(count, 0);
  incr();
  assert.equal(count, 1);

}).call(global);