(function (global, factory) {
	typeof define === 'function' && define.amd ? define(['exports'], factory) :
	typeof exports === 'object' ? factory(exports) :
	(global.myModule = {}, factory(global.myModule))
}(this, function (exports) { 'use strict';

	var one = 1;
	var two = 2;
	var three = 3;

	var four = one + 3;
	var five = two + 3;
	var six = three + 3;

	exports.four = four = 99;

	exports.five = five;
	exports.six = six;

}));