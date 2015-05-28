(function (factory) {
	!(typeof exports === 'object' && typeof module !== 'undefined') &&
	typeof define === 'function' && define.amd ? define(factory) :
	factory()
}(function () { 'use strict';

	var foo = {
		get y () { return x; }
	};

	var x = 42;

	console.log( foo.y );

}));