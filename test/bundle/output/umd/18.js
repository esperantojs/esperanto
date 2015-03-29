(function (factory) {
	!(typeof exports === 'object' && typeof module !== 'undefined') &&
	typeof define === 'function' && define.amd ? define(factory) :
	factory()
}(function () { 'use strict';

	var _doThing = function () {
		console.log( 'doing foo thing' );
	}

	var foo = function () {
		_doThing();
	}

	var bar = function () {
		doThing();
	}

	var doThing = function ( item ) {
		console.log( 'doing bar thing' );
	}



}));