(function () {

	'use strict';

	var a = require('./a');
	
	/* jshint esnext:true */
	
	exports.default = { b: 2, get a() { return a.default.a; } };

}).call(global);