(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(require('bluebird')) :
	typeof define === 'function' && define.amd ? define(['bluebird'], factory) :
	factory(global.bluebird);
}(this, function (bluebird) { 'use strict';

	var foo = 'foo';



}));