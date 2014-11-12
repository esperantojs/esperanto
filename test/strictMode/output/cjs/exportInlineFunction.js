(function () {

	'use strict';

	exports.foo = foo;
	
	function foo ( str ) {
		return str.toUpperCase();
	}

}).call(global);