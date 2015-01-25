(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
	typeof define === 'function' && define.amd ? define('foo', ['exports'], factory) :
	factory((global.myModule = {}))
}(this, function (exports) { 'use strict';

	var foo = "bar";

	if (false) {
		someFunction = function foo() {  };
	}

	exports.foo = foo;

}));