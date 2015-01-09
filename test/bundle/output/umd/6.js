(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(require('utils/external')) :
	typeof define === 'function' && define.amd ? define(['utils/external'], factory) :
	factory(global.external)
}(this, function (external) { 'use strict';

	var external__default = ('default' in external ? external['default'] : external);

	var message = 'this is a message';

	console.log( message );

}));