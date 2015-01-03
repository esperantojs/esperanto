/* this is a banner */
(function () {

	'use strict';

	function foo () {
		console.log( 'fooing' );
	}

	function bar () {
		console.log( 'baring' );
	}

	foo();
	bar();

}).call(global);
/* this is a footer */