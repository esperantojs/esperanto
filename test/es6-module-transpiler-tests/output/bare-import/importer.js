(function () {

	'use strict';

	require('./exporter');
	
	/* jshint esnext:true */
	
	assert.equal(global.sideEffectyValue, 99);

}).call(global);