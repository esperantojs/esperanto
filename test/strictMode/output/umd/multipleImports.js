(function (global, factory) {
	typeof define === 'function' && define.amd ? define(['exports', 'foo', 'bar', 'baz'], factory) :
	typeof exports === 'object' ? factory(exports, require('foo'), require('bar'), require('baz')) :
	(global.myModule = {}, factory(global.myModule, global.foo, global.bar, global.baz))
}(this, function (exports, foo, bar, baz) { 'use strict';

	var qux = foo['default']( bar['default']( baz['default'] ) );
	exports['default'] = qux;

}));