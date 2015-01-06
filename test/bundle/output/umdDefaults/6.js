(function (global, factory) {
	typeof define === 'function' && define.amd ? define(['utils/external'], factory) :
	typeof exports === 'object' ? factory(require('utils/external')) :
	factory(global.external)
}(this, function (external__default) { 'use strict';

	var message = 'this is a message';

	console.log( message );

}));