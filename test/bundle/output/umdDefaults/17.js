(function (factory) {
	typeof define === 'function' && define.amd ? define(factory) :
	factory()
}(function () { 'use strict';

	function foo__a ( message ) {
		console.log( message );
	}

	foo__a();
	(function () {
		var a = 'c';
		foo__a( a );
	}());

}));