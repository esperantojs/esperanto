(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	global.myModule = factory();
}(this, function () { 'use strict';

	var hasOwnProperty = Object.prototype.hasOwnProperty;

	function main () {
		console.log( hasOwnProperty.call({ foo: 'bar' }, 'foo' ) );
	}

	return main;

}));
