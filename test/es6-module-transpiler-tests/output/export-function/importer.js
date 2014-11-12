(function () {

	'use strict';

	var exporter = require('./exporter');
	
	/* jshint esnext:true */
	
	assert.equal(exporter.foo(), 121);

}).call(global);