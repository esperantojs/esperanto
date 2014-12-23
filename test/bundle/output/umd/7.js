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

	var foo = 'this is foo';

	function logFoo () {
		console.log( foo );
	}

	function logBar () {
		console.log( bar );
	}

}));