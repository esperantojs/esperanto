(function (global, factory) {

	'use strict';

	if (typeof define === 'function' && define.amd) {
		// export as AMD
		define([], factory);
	} else if (typeof module !== 'undefined' && module.exports && typeof require === 'function') {
		// node/browserify
		factory();
	} else {
		// browser global
		global.myModule = {};
		factory();
	}

}(typeof window !== 'undefined' ? window : this, function () {

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

}));