(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(require('external')) :
	typeof define === 'function' && define.amd ? define(['external'], factory) :
	factory(global.external);
}(this, function (external) { 'use strict';

	external = 'default' in external ? external['default'] : external;

	var bar = 'yes';
	var foo = bar;

	console.log( external( foo ) );

}));
