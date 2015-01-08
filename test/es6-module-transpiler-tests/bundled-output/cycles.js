(function () {

  'use strict';

  /* jshint esnext:true */

  function geta() {
    return a;
  }

  var b = 2;

  /* jshint esnext:true */

  function getb() {
    return b;
  }

  var a = 1;

  /* jshint esnext:true */

  assert.equal(geta(), 1);
  assert.equal(a, 1);
  assert.equal(getb(), 2);
  assert.equal(b, 2);

}).call(global);