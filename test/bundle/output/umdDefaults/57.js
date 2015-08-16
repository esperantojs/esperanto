(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	factory();
}(this, function () { 'use strict';

	var foo = {
		get y () { return x; }
	};

	var x = 42;

	console.log( foo.y );

}));