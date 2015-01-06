(function (global, factory) {
	typeof define === 'function' && define.amd ? define(['external'], factory) :
	typeof exports === 'object' ? factory(require('external')) :
	factory(global.external)
}(this, function (external) { 'use strict';

	var external__default = ('default' in external ? external['default'] : external);

	external.foo();

}));