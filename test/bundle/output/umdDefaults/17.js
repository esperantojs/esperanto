(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	factory();
}(this, function () { 'use strict';

	function a ( message ) {
		console.log( message );
	}

	a();
	(function () {
		var a$$ = 'c';
		a( a$$ );
	}());

}));
