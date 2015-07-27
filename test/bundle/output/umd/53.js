(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
	typeof define === 'function' && define.amd ? define(['exports'], factory) :
	factory((global.myModule = {}));
}(this, function (exports) { 'use strict';

	function foo () {
		console.log( 'foo' );
	}

	foo();

	function main () {
		console.log( 'main' );
	}

	exports['default'] = main;

}));
