(function (factory) {
	typeof define === 'function' && define.amd ? define([], factory) :
	factory()
}(function () { 'use strict';

	var foo = 'this is foo';

	function logFoo () {
		console.log( foo );
	}

	function logBar () {
		console.log( bar );
	}

}));