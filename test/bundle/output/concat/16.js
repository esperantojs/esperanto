(function () { 'use strict';

	function _a () {
		console.log( 'a but actually c' );
	}

	function b () {
		// a but actually c
		_a();
	}

	function a () {
		console.log( 'a' );
	}

	function foo () {
		a();
		b();
	}

})();
