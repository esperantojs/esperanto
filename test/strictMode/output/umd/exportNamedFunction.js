(function (global, factory) {
	typeof define === 'function' && define.amd ? define(['exports'], factory) :
	typeof exports === 'object' ? factory(exports) :
	(global.myModule = {}, factory(global.myModule))
}(this, function (exports) { 'use strict';

	exports.foo = foo;
	exports.bar = bar;
	exports.baz = baz;

	function foo() {}
	function bar() {}
	function baz() {}

}));