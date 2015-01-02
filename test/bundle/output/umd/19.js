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

	var hasOwnProperty = Object.prototype.hasOwnProperty;
	var hasOwnProperty__default = hasOwnProperty;

	console.log( hasOwnProperty__default.call({ foo: 'bar' }, 'foo' ) );

}));