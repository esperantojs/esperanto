(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
	typeof define === 'function' && define.amd ? define(['exports'], factory) :
	factory((global.myModule = {}));
}(this, function (exports) { 'use strict';

	var answer = 42;

	var main = answer * 2;

	exports['default'] = main;

}));
