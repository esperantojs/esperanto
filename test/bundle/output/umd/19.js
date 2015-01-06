(function (factory) {
	typeof define === 'function' && define.amd ? define(factory) :
	factory()
}(function () { 'use strict';

	var hasOwnProperty = Object.prototype.hasOwnProperty;

	console.log( hasOwnProperty.call({ foo: 'bar' }, 'foo' ) );

}));