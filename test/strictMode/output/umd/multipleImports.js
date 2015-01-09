(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('foo'), require('bar'), require('baz')) :
	typeof define === 'function' && define.amd ? define(['exports', 'foo', 'bar', 'baz'], factory) :
	factory((global.myModule = {}), global.foo, global.bar, global.baz)
}(this, function (exports, foo, bar, baz) { 'use strict';

	var qux = foo['default']( bar['default']( baz['default'] ) );
	exports['default'] = qux;

}));