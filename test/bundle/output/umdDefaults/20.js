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

	var hasOwnProperty = Object.prototype.hasOwnProperty;

	var main = function () {
		console.log( hasOwnProperty.call({ foo: 'bar' }, 'foo' ) );
	}

	return undefined;

}));