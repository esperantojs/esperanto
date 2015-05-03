(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
	typeof define === 'function' && define.amd ? define(['exports'], factory) :
	factory((global.myModule = {}))
}(this, function (exports) { 'use strict';

	var foo = function () {
		console.log( 'foo' );
	}

	foo();

	var main = function () {
		console.log( 'main' );
	}

	exports['default'] = main;

}));