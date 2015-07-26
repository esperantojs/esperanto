/* this is a banner */
(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	factory();
}(this, function () { 'use strict';

	function foo () {
		console.log( 'fooing' );
	}

	function bar () {
		console.log( 'baring' );
	}

	foo();
	bar();

}));
/* this is a footer */