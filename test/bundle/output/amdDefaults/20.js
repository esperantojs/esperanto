define(function () { 'use strict';

	var hasOwnProperty = Object.prototype.hasOwnProperty;

	function main () {
		console.log( hasOwnProperty.call({ foo: 'bar' }, 'foo' ) );
	}

	return main;

});
