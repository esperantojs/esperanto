(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
	typeof define === 'function' && define.amd ? define(['exports'], factory) :
	factory((global.myModule = {}))
}(this, function (exports) { 'use strict';

	exports.decr = decr;

	var a = 100;

	function decr () {
		console.log( '%d bottles of beer on the wall', ( --a, exports.num = a ) );
		console.log( '%d bottles of beer', ( a--, exports.num = a, a + 1 ) );
	}

	exports.num = a;

}));