(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(require('moment')) :
	typeof define === 'function' && define.amd ? define(['moment'], factory) :
	factory(global.moment);
}(this, function (x) { 'use strict';

	x = 'default' in x ? x['default'] : x;

	var __x = 'wut';
	var a = __x;

	x();
	console.log( a );

}));
