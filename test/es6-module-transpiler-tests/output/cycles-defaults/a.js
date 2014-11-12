(function () {

	'use strict';

	var b = require('./b');
	
	/* jshint esnext:true */
	
	exports.default = { a: 1, get b() { return b.default.b; } };

}).call(global);