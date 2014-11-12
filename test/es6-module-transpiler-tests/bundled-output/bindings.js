(function () {

  'use strict';

  /* jshint esnext:true */
  
  var exporter__count = 0;
  
  function exporter__incr() {
    exporter__count++;
  }

	/* jshint esnext:true */
	
	assert.equal(exporter__count, 0);
	exporter__incr();
	assert.equal(exporter__count, 1);

}).call(global);