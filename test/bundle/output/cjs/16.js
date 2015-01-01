(function () {

	'use strict';

	function _a__a () {
		console.log( 'a' );
	}

	function a__a () {
		console.log( 'a but actually c' );
	}

	var b = function () {
		// a but actually c
		a__a();
	}

	function foo () {
		_a__a();
	}

}).call(global);