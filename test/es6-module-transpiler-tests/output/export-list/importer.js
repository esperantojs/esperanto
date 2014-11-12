(function () {

	'use strict';

	var exporter = require('./exporter');
	
	/* jshint esnext:true */
	
	assert.equal(exporter.a, 1);
	assert.equal(exporter.b, 2);
	exporter.incr();
	assert.equal(exporter.a, 2);
	assert.equal(exporter.b, 3);

}).call(global);