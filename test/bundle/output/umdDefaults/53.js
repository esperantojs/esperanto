(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	global.myModule = factory();
}(this, function () { 'use strict';

	var foo = function () {
		console.log( 'foo' );
	}

	foo();

	var main = function () {
		console.log( 'main' );
	}

	return main;

}));