'use strict';

var foo__default = notActuallyFoo;

function notActuallyFoo () {
	foo();
}

function foo () {
	console.log( 'actually foo' );
}

foo__default();