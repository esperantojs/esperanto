(function () {

	'use strict';

	Object.defineProperty(exports, 'a', { get: function () { return first.a; }});
	
	var first = require('./first');
	
	/* jshint esnext:true */
	
	assert.equal(typeof a, 'undefined');

}).call(global);