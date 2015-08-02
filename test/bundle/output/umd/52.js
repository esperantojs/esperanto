(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	factory();
}(this, function () { 'use strict';

	// foo.js

	function baz () {
		// baz.js
	}

	// bar.js
	console.log( 'baz', baz );

	// main.js

}));
