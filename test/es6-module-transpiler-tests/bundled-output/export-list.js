(function () {

  'use strict';

  /* jshint esnext:true */

  var a = 1;
  var b = 2;

  function incr() {
    var c = a++; // Capture `a++` to force us to use a temporary variable.
    b++;
  }

  /* jshint esnext:true */

  assert.equal(a, 1);
  assert.equal(b, 2);
  incr();
  assert.equal(a, 2);
  assert.equal(b, 3);

}).call(global);