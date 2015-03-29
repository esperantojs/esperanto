define(function () {

	'use strict';

	var _foo = notActuallyFoo;

	function notActuallyFoo () {
		foo();
	}

	function foo () {
		console.log( 'actually foo' );
	}

	_foo();

});