(function (factory) {
	!(typeof exports === 'object' && typeof module !== 'undefined') &&
	typeof define === 'function' && define.amd ? define(factory) :
	factory()
}(function () { 'use strict';

	function foo () {
		console.log( 'foo' );
	}

	foo();

}));