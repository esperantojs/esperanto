(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('bar')) :
	typeof define === 'function' && define.amd ? define(['exports', 'bar'], factory) :
	factory((global.myModule = {}), global.bar)
}(this, function (exports, bar) { 'use strict';

	Object.defineProperty(exports, 'foo', { enumerable: true, get: function () { return bar.foo; }});

}));