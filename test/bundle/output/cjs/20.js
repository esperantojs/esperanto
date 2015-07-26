'use strict';

var hasOwnProperty = Object.prototype.hasOwnProperty;

function main () {
	console.log( hasOwnProperty.call({ foo: 'bar' }, 'foo' ) );
}

exports['default'] = main;
