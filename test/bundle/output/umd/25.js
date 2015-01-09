(function (factory) {
	!(typeof exports === 'object' && typeof module !== 'undefined') &&
	typeof define === 'function' && define.amd ? define('myModule', factory) :
	factory()
}(function () { 'use strict';

	var foo = function () {
		console.log( 'fooing' );
	}

	foo();

}));