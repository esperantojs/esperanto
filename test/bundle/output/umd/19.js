(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	factory();
}(this, function () { 'use strict';

	var hasOwnProperty = Object.prototype.hasOwnProperty;

	console.log( hasOwnProperty.call({ foo: 'bar' }, 'foo' ) );

}));