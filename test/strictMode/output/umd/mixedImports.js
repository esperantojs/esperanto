(function (global, factory) {

	'use strict';

	if (typeof define === 'function' && define.amd) {
		// export as AMD
		define(['exports', 'asap'], factory);
	} else if (typeof module !== 'undefined' && module.exports && typeof require === 'function') {
		// node/browserify
		factory(exports, require('asap'));
	} else {
		// browser global
		global.myModule = {};
		factory(global.myModule, global.asap);
	}

}(typeof window !== 'undefined' ? window : this, function (exports, asap) {

	'use strict';

}));