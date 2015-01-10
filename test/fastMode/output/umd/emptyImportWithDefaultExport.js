(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory(require('foo'), require('polyfills')) :
	typeof define === 'function' && define.amd ? define(['foo', 'polyfills'], factory) :
	global.myModule = factory(global.foo)
}(this, function (foo) { 'use strict';


	return 'baz';

}));