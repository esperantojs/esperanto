/* this is a banner */
(function (factory) {
	!(typeof exports === 'object' && typeof module !== 'undefined') &&
	typeof define === 'function' && define.amd ? define(factory) :
	factory()
}(function () { 'use strict';

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