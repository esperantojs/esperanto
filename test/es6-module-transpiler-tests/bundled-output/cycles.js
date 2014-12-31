(function () {

	'use strict';

  /* jshint esnext:true */

  function geta() {
    return a__a;
  }

  var b__b = 2;

  /* jshint esnext:true */

  function getb() {
    return b__b;
  }

  var a__a = 1;

	/* jshint esnext:true */

	assert.equal(geta(), 1);
	assert.equal(a__a, 1);
	assert.equal(getb(), 2);
	assert.equal(b__b, 2);

}).call(global);