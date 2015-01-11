(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	global.myModule = factory()
}(this, function () { 'use strict';

	var answer = 42;

	var main = answer * 2;

	return main;

}));