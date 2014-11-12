(function () {

	'use strict';

	var second = require('./second');
	
	/* jshint esnext:true */
	
	assert.equal(second.a, 1);

}).call(global);