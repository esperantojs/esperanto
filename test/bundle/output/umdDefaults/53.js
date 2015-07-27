(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	global.myModule = factory();
}(this, function () { 'use strict';

	function foo () {
		console.log( 'foo' );
	}

	foo();

	function main () {
		console.log( 'main' );
	}

	return main;

}));
