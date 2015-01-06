(function (global, factory) {
	typeof define === 'function' && define.amd ? define(['foo', 'polyfills'], factory) :
	typeof exports === 'object' ? factory(require('foo'), require('polyfills')) :
	factory(global.foo)
}(this, function (foo) { 'use strict';

}));