/* this is a banner */
(function (global, factory) {

	'use strict';

	if (typeof define === 'function' && define.amd) {
		// export as AMD
		define(['exports', 'whatever'], factory);
	} else if (typeof module !== 'undefined' && module.exports && typeof require === 'function') {
		// node/browserify
		factory(exports, require('whatever'));
	} else {
		// browser global
		global.myModule = {};
		factory(global.myModule, global.whatever);
	}

}(typeof window !== 'undefined' ? window : this, function (exports, whatever) {

	'use strict';

	whatever['default']();

	exports['default'] = 'someExport';

}));