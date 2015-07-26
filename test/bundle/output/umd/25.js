(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory() :
	typeof define === 'function' && define.amd ? define('myModule', factory) :
	factory();
}(this, function () { 'use strict';

	var foo = function () {
		console.log( 'fooing' );
	}

	foo();

}));