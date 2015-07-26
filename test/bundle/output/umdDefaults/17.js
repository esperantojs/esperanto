(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	factory();
}(this, function () { 'use strict';

	function foo__a ( message ) {
		console.log( message );
	}

	foo__a();
	(function () {
		var a = 'c';
		foo__a( a );
	}());

}));