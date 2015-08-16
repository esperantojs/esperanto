define(['exports'], function (exports) {

	'use strict';

	function foo () {
		console.log( 'fooing' );
	}

	exports.foo = foo;

	// foo
	foo();

});