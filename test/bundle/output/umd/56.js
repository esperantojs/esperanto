(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	factory();
}(this, function () { 'use strict';

	var foo = 42;
	var _foo = foo;
	foo = 99;
	foo += 1;
	foo++;

	console.log( _foo ); // 42

}));