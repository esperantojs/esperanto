(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(require('external')) :
	typeof define === 'function' && define.amd ? define(['external'], factory) :
	factory(global.external)
}(this, function (external__default) { 'use strict';

	var bar = 'yes';
	var foo = bar;

	console.log( external__default( foo ) );

}));