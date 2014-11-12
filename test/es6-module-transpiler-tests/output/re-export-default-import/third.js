(function () {

	'use strict';

	var second = require('./second');
	
	/* jshint esnext:true */
	
	assert.equal(second.hi(), 'hi');

}).call(global);