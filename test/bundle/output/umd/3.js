(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(require('external')) :
	typeof define === 'function' && define.amd ? define(['external'], factory) :
	factory(global.external)
}(this, function (external) { 'use strict';

	var external__default = ('default' in external ? external['default'] : external);

	var bar = 'yes';
	var foo = bar;

	console.log( external__default( foo ) );

}));