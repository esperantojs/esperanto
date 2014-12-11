(function () {

	'use strict';

	Object.defineProperty(exports, 'hi', { get: function () { return hi.default; }});
	
	var hi = require('./first');
	
	/* jshint esnext:true */

}).call(global);