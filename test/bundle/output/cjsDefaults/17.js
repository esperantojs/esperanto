'use strict';

function a ( message ) {
	console.log( message );
}

a();
(function () {
	var a$$ = 'c';
	a( a$$ );
}());
