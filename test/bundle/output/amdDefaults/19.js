define(function () {

	'use strict';

	var hasOwnProperty = Object.prototype.hasOwnProperty;
	var hasOwnProperty__default = hasOwnProperty;

	console.log( hasOwnProperty__default.call({ foo: 'bar' }, 'foo' ) );

});