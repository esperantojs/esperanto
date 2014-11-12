(function () {

	'use strict';

	var exporter = require('./exporter');
	
	/* jshint esnext:true */
	
	assert.equal(exporter.count, 0);
	exporter.incr();
	assert.equal(exporter.count, 1);

}).call(global);