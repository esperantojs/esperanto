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

	var message = 'yes';
	var foo__default = message;

	console.log( foo__default );

}));