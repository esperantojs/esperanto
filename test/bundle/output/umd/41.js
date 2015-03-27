(function (factory) {
	!(typeof exports === 'object' && typeof module !== 'undefined') &&
	typeof define === 'function' && define.amd ? define(factory) :
	factory()
}(function () { 'use strict';

	var baz__foo = 42;

	function main__foo () {
		console.log( 'foo' );
	}

	console.log( baz__foo );

}));