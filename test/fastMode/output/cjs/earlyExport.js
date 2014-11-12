(function () {

	'use strict';
	
	module.exports = foo;
	
	function foo () {
		console.log( 'fooing' );
	}

}).call(global);