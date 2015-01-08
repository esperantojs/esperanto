(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
	typeof define === 'function' && define.amd ? define(['exports'], factory) :
	factory((global.myModule = {}))
}(this, function (exports) { 'use strict';

	exports.foo = foo;
	exports.bar = bar;
	exports.baz = baz;

	function foo() {}
	function bar() {}
	function baz() {}

}));