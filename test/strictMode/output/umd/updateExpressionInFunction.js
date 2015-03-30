(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
	typeof define === 'function' && define.amd ? define(['exports'], factory) :
	factory((global.myModule = {}))
}(this, function (exports) { 'use strict';

	exports.incr = incr;

	var a = 1;

	function incr () {
		var b = a++; exports.num = a;
		console.log( 'incremented from %s to %s', b, a );
	}

	exports.num = a;

}));