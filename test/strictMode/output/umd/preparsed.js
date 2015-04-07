(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(require('./bar')) :
	typeof define === 'function' && define.amd ? define(['./bar'], factory) :
	factory(global.foo)
}(this, function (foo) { 'use strict';

}));