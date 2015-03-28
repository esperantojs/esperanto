(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
	typeof define === 'function' && define.amd ? define(['exports'], factory) :
	factory((global.myModule = {}))
}(this, function (exports) { 'use strict';

	var foo = function () {};
	var bar = 'a';

	if ( false ) {
		foo = function () {
			exports.bar = bar = 'b';
		};
	}

	exports.foo = foo;
	exports.bar = bar;

}));