(function (factory) {
	!(typeof exports === 'object' && typeof module !== 'undefined') &&
	typeof define === 'function' && define.amd ? define(factory) :
	factory()
}(function () { 'use strict';

	var foo = 'foo';

	var bar = 'bar';

	// Preserve comments after imports

	console.log( foo );

}));