(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('x/y/z')) :
	typeof define === 'function' && define.amd ? define(['exports', 'x/y/z'], factory) :
	factory((global.myModule = {}), global.y__z)
}(this, function (exports, y__z) { 'use strict';

	exports.bar = bar;

	function bar ( z ) {
		return y__z.foo( z );
	}

}));