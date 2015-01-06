(function (global, factory) {
	typeof define === 'function' && define.amd ? define(['external'], factory) :
	typeof exports === 'object' ? factory(require('external')) :
	factory(global.external)
}(this, function (external__default) { 'use strict';

	var bar = 'yes';
	var foo = bar;

	console.log( external__default( foo ) );

}));