(function (factory) {
	!(typeof exports === 'object' && typeof module !== 'undefined') &&
	typeof define === 'function' && define.amd ? define(factory) :
	factory()
}(function () { 'use strict';

	function _a__a () {
		console.log( 'a' );
	}

	function c__a () {
		console.log( 'a but actually c' );
	}

	var b = function () {
		// a but actually c
		c__a();
	}

	function foo () {
		_a__a();
	}

}));