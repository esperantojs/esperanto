(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
	typeof define === 'function' && define.amd ? define(['exports'], factory) :
	factory((global.myModule = {}));
}(this, function (exports) { 'use strict';

	var baz = 4;

	exports.foo = 1;
	exports.bar = 2;

	exports.foo = 3;

	exports.qux = 5;
	exports.qux = 6;

	exports.baz = baz;

}));
