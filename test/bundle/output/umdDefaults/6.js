(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(require('utils/external')) :
	typeof define === 'function' && define.amd ? define(['utils/external'], factory) :
	factory(global.external)
}(this, function (external__default) { 'use strict';

	var message = 'this is a message';

	console.log( message );

}));