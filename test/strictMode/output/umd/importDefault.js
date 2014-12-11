(function (global, factory) {

	'use strict';

	if (typeof define === 'function' && define.amd) {
		// export as AMD
		define(['exports', 'foo'], factory);
	} else if (typeof module !== 'undefined' && module.exports && typeof require === 'function') {
		// node/browserify
		factory(exports, require('foo'));
	} else {
		// browser global
		global.myModule = {};
		factory(global.myModule, global.foo);
	}

}(typeof window !== 'undefined' ? window : this, function (exports, foo) {

	'use strict';

	console.log( foo.default );

}));