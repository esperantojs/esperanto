(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
	typeof define === 'function' && define.amd ? define(['exports'], factory) :
	factory((global.myModule = {}))
}(this, function (exports) { 'use strict';

	var hasOwnProperty = Object.prototype.hasOwnProperty;

	var main = function () {
		console.log( hasOwnProperty.call({ foo: 'bar' }, 'foo' ) );
	}

	exports['default'] = main;

}));