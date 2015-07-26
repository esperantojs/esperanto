(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	factory();
}(this, function () { 'use strict';

	var not_baz = function () {
		// baz.js
	};



	console.log( 'baz', not_baz );



}));