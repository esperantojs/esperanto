(function (factory) {
	!(typeof exports === 'object' && typeof module !== 'undefined') &&
	typeof define === 'function' && define.amd ? define(factory) :
	factory()
}(function () { 'use strict';

	var _foo = notActuallyFoo;

	function notActuallyFoo () {
		foo();
	}

	function foo () {
		console.log( 'actually foo' );
	}

	_foo();

}));