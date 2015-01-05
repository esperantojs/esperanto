(function (global, factory) {

	'use strict';

	if (typeof define === 'function' && define.amd) {
		// export as AMD
		define('myModule', [], factory);
	} else if (typeof module !== 'undefined' && module.exports && typeof require === 'function') {
		// node/browserify
		module.exports = factory();
	} else {
		// browser global
		global.myModule = factory();
	}

}(typeof window !== 'undefined' ? window : this, function () {

	'use strict';

	var foo = function () {
		console.log( 'fooing' );
	}

	foo();

}));