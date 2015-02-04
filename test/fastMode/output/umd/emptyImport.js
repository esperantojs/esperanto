(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(require('polyfills'), require('foo')) :
	typeof define === 'function' && define.amd ? define(['polyfills', 'foo'], factory) :
	factory(undefined, global.bar)
}(this, function (__dep0__, bar) { 'use strict';

}));