(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	factory();
}(this, function () { 'use strict';

	function _a () {
		console.log( 'a but actually c' );
	}

	function b () {
		// a but actually c
		_a();
	}

	function a () {
		console.log( 'a' );
	}

	function foo () {
		a();
		b();
	}

}));
