(function (global, factory) {
	typeof define === 'function' && define.amd ? define(['utils/external'], factory) :
	typeof exports === 'object' ? factory(require('utils/external')) :
	factory(global.external)
}(this, function (external) { 'use strict';

	var external__default = ('default' in external ? external['default'] : external);

	var message = 'this is a message';

	console.log( message );

}));