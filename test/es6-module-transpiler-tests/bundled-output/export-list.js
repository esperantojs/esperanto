(function () {

  'use strict';

  /* jshint esnext:true */
  
  var exporter__a = 1;
  var exporter__b = 2;
  
  function exporter__incr() {
    var c = exporter__a++; // Capture `a++` to force us to use a temporary variable.
    exporter__b++;
  }

	/* jshint esnext:true */
	
	assert.equal(exporter__a, 1);
	assert.equal(exporter__b, 2);
	exporter__incr();
	assert.equal(exporter__a, 2);
	assert.equal(exporter__b, 3);

}).call(global);