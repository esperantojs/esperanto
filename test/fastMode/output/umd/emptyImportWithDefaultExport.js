(function (global, factory) {

	'use strict';

	if (typeof define === 'function' && define.amd) {
		// export as AMD
		define(['foo', 'polyfills'], factory);
	} else if (typeof module !== 'undefined' && module.exports && typeof require === 'function') {
		// node/browserify
		module.exports = factory(require('foo'), require('polyfills'));
	} else {
		// browser global
		global.myModule = factory(global.foo);
	}

}(typeof window !== 'undefined' ? window : this, function (foo) {

	'use strict';
	
	return 'baz';

}));