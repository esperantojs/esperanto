(function (factory) {
	typeof define === 'function' && define.amd ? define([], factory) :
	factory()
}(function () { 'use strict';

	var message = 'yes';
	var foo = message;

	console.log( foo );

}));