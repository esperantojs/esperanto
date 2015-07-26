define(function () { 'use strict';

	var foo = function () {
		console.log( 'foo' );
	}

	foo();

	var main = function () {
		console.log( 'main' );
	}

	return main;

});
