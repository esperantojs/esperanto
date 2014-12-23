(function () {

  'use strict';

  /* jshint esnext:true */

  function hi() {
    return 'hi';
  }
  var hi = hi;

	/* jshint esnext:true */

	/* jshint esnext:true */

	assert.equal(hi(), 'hi');

}).call(global);