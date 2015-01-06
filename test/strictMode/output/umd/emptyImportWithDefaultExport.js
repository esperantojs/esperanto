(function (global, factory) {
	typeof define === 'function' && define.amd ? define(['exports', 'foo', 'polyfills'], factory) :
	typeof exports === 'object' ? factory(exports, require('foo'), require('polyfills')) :
	(global.myModule = {}, factory(global.myModule, global.foo))
}(this, function (exports, foo) { 'use strict';

	exports['default'] = 'baz';

}));