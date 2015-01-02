(function (global, factory) {

	'use strict';

	if (typeof define === 'function' && define.amd) {
		// export as AMD
		define([], factory);
	} else if (typeof module !== 'undefined' && module.exports && typeof require === 'function') {
		// node/browserify
		module.exports = factory();
	} else {
		// browser global
		global.myModule = factory();
	}

}(typeof window !== 'undefined' ? window : this, function () {

	'use strict';

	var doThing__default = function () {
		console.log( 'doing foo thing' );
	}

	var foo = function () {
		doThing__default();
	}

	var bar = function () {
		doThing();
	}

	var doThing = function ( item ) {
		console.log( 'doing bar thing' );
	}



}));