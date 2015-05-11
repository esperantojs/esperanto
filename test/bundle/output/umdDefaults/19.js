(function (factory) {
	!(typeof exports === 'object' && typeof module !== 'undefined') &&
	typeof define === 'function' && define.amd ? define(factory) :
	factory()
}(function () { 'use strict';

	var hasOwnProperty = Object.prototype.hasOwnProperty;

	console.log( hasOwnProperty.call({ foo: 'bar' }, 'foo' ) );

}));