(function (factory) {
	!(typeof exports === 'object' && typeof module !== 'undefined') &&
	typeof define === 'function' && define.amd ? define(factory) :
	factory()
}(function () { 'use strict';

	var hasOwnProperty = Object.prototype.hasOwnProperty;
	var _hasOwnProperty = hasOwnProperty;

	console.log( _hasOwnProperty.call({ foo: 'bar' }, 'foo' ) );

}));