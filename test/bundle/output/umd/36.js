(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	factory();
}(this, function () { 'use strict';

	function dependsOnExternal () {
		console.log( external.message );
	}

	function external () {
		dependsOnExternal();
	}

	external.message = 'don\'t try this at home';

	external();

}));