define(['exports'], function (exports) {

	'use strict';

	var foo = function () {
		console.log( 'foo' );
	}

	foo();

	var main = function () {
		console.log( 'main' );
	}

	exports['default'] = main;

});