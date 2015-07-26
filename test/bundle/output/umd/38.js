(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	factory();
}(this, function () { 'use strict';

	var _foo = notActuallyFoo;

	function notActuallyFoo () {
		foo();
	}

	function foo () {
		console.log( 'actually foo' );
	}

	_foo();

}));