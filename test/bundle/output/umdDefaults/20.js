(function (global, factory) {
	typeof define === 'function' && define.amd ? define([], factory) :
	typeof exports === 'object' ? module.exports = factory() :
	global.myModule = factory()
}(this, function () { 'use strict';

	var hasOwnProperty = Object.prototype.hasOwnProperty;

	var main = function () {
		console.log( hasOwnProperty.call({ foo: 'bar' }, 'foo' ) );
	}

	return main;

}));