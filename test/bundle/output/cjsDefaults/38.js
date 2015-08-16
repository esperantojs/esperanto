'use strict';

function notActuallyFoo () {
	foo();
}

function foo () {
	console.log( 'actually foo' );
}

notActuallyFoo();
