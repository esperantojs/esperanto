(function () {

  'use strict';

  /* jshint esnext:true */
  
  function b__geta() {
    return a__a;
  }
  
  var b__b = 2;

  /* jshint esnext:true */
  
  function a__getb() {
    return b__b;
  }
  
  var a__a = 1;

	/* jshint esnext:true */
	
	assert.equal(b__geta(), 1);
	assert.equal(a__a, 1);
	assert.equal(a__getb(), 2);
	assert.equal(b__b, 2);

}).call(global);