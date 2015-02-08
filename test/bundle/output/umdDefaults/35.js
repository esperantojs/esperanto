(function (factory) {
	!(typeof exports === 'object' && typeof module !== 'undefined') &&
	typeof define === 'function' && define.amd ? define(factory) :
	factory()
}(function () { 'use strict';

	function a () {
		console.log( 'I am module a' );
	}

	function c () {
		console.log( 'I am module c' );
	}

	function b () {
		console.log( 'I am module b' );
		c();
	}

	function external () {
		console.log( 'I am an external dependency' );
		a();
		b();
	}

	external();

}));