define(['exports'], function (exports) {

	'use strict';

	var hasOwnProperty = Object.prototype.hasOwnProperty;

	var main = function () {
		console.log( hasOwnProperty.call({ foo: 'bar' }, 'foo' ) );
	}

	exports['default'] = undefined;

});