(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('foo'), require('polyfills')) :
	typeof define === 'function' && define.amd ? define(['exports', 'foo', 'polyfills'], factory) :
	factory((global.myModule = {}), global.foo)
}(this, function (exports, foo) { 'use strict';

	exports['default'] = 'baz';

}));