(function (factory) {
	!(typeof exports === 'object' && typeof module !== 'undefined') &&
	typeof define === 'function' && define.amd ? define(factory) :
	factory()
}(function () { 'use strict';

	function dependsOnExternal () {
		console.log( external.message );
	}

	function external () {
		dependsOnExternal();
	}

	external.message = 'don\'t try this at home';

	external();

}));