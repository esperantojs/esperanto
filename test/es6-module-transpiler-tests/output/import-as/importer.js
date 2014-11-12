(function () {

	'use strict';

	var exporter = require('./exporter');
	
	/* jshint esnext:true */
	
	assert.equal(exporter.a, 'a');
	assert.equal(exporter.b, 'b');
	assert.equal(exporter.default, 'DEF');

}).call(global);