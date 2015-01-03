(function () {

	'use strict';

	function foo () {
		console.log( 'fooing' );
	}

	exports.foo = foo;

	foo();

}).call(global);