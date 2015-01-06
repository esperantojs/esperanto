(function (factory) {
	typeof define === 'function' && define.amd ? define([], factory) :
	factory()
}(function () { 'use strict';

	var doThing__default = function () {
		console.log( 'doing foo thing' );
	}

	var foo = function () {
		doThing__default();
	}

	var bar = function () {
		doThing();
	}

	var doThing = function ( item ) {
		console.log( 'doing bar thing' );
	}



}));