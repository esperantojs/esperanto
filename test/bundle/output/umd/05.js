(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
	typeof define === 'function' && define.amd ? define(['exports'], factory) :
	factory((global.myModule = {}));
}(this, function (exports) { 'use strict';

	var one = 1;
	var two = 2;
	var three = 3;

	exports.four = one + 3;
	exports.five = two + 3;
	exports.six = three + 3;

	exports.four = 99;

}));
