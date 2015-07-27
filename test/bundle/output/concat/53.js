var myModule = (function () { 'use strict';

	function foo () {
		console.log( 'foo' );
	}

	foo();

	function main () {
		console.log( 'main' );
	}

	return main;

})();
