(function () { 'use strict';

	function _doThing () {
		console.log( 'doing foo thing' );
	}

	function foo () {
		_doThing();
	}

	function bar () {
		doThing();
	}

	var doThing = function ( item ) {
		console.log( 'doing bar thing' );
	}

	foo();
	bar();

})();
