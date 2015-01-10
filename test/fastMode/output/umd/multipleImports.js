(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory(require('foo'), require('bar'), require('baz')) :
	typeof define === 'function' && define.amd ? define(['foo', 'bar', 'baz'], factory) :
	global.myModule = factory(global.foo, global.bar, global.baz)
}(this, function (foo, bar, baz) { 'use strict';

	var qux = foo( bar( baz ) );

	return qux;

}));