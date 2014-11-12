(function () {

	'use strict';

	var second = require('./second');
	
	/* jshint esnext:true */
	
	assert.equal(second.value, 42);

}).call(global);