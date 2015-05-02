(function (factory) {
	!(typeof exports === 'object' && typeof module !== 'undefined') &&
	typeof define === 'function' && define.amd ? define(factory) :
	factory()
}(function () { 'use strict';

	var not_baz = function () {
		// baz.js
	};



	console.log( 'baz', not_baz );



}));