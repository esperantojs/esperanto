(function () {

  'use strict';

  /* jshint esnext:true */
  
  function exporter__foo() {
    return 121;
  }
  assert.equal(exporter__foo(), 121);

	/* jshint esnext:true */
	
	assert.equal(exporter__foo(), 121);

}).call(global);