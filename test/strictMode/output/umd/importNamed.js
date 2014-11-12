(function (global, factory) {

	'use strict';

	if (typeof define === 'function' && define.amd) {
		// export as AMD
		define(['exports', 'baz'], factory);
	} else if (typeof module !== 'undefined' && module.exports && typeof require === 'function') {
		// node/browserify
		factory(exports, require('baz'));
	} else {
		// browser global
		global.myModule = {};
		factory(global.myModule, global.__baz);
	}

}(typeof window !== 'undefined' ? window : this, function (exports, __baz) {

	'use strict';

}));