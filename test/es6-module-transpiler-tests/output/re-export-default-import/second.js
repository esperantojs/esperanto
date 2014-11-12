(function () {

	'use strict';

	Object.defineProperty(exports, 'hi', { get: function () { return first.default; }});
	
	var first = require('./first');
	
	/* jshint esnext:true */

}).call(global);