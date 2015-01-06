(function (global, factory) {
	typeof define === 'function' && define.amd ? define(['external'], factory) :
	typeof exports === 'object' ? factory(require('external')) :
	factory(global.foo)
}(this, function (foo) { 'use strict';

	var foo__default = ('default' in foo ? foo['default'] : foo);

	foo__default();

}));