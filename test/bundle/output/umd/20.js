(function (global, factory) {
	typeof define === 'function' && define.amd ? define(['exports'], factory) :
	typeof exports === 'object' ? factory(exports) :
	(global.myModule = {}, factory(global.myModule))
}(this, function (exports) { 'use strict';

	var hasOwnProperty = Object.prototype.hasOwnProperty;

	var main = function () {
		console.log( hasOwnProperty.call({ foo: 'bar' }, 'foo' ) );
	}

	exports['default'] = main;

}));