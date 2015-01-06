(function (global, factory) {
	typeof define === 'function' && define.amd ? define(['external'], factory) :
	typeof exports === 'object' ? factory(require('external')) :
	factory(global.foo)
}(this, function (foo__default) { 'use strict';

	foo__default();

}));