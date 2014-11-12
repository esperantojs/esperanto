(function (global, factory) {

	'use strict';

	if (typeof define === 'function' && define.amd) {
		// export as AMD
		define(['exports', 'fs'], factory);
	} else if (typeof module !== 'undefined' && module.exports && typeof require === 'function') {
		// node/browserify
		factory(exports, require('fs'));
	} else {
		// browser global
		global.myModule = {};
		factory(global.myModule, global.__fs);
	}

}(typeof window !== 'undefined' ? window : this, function (exports, __fs) {

	'use strict';

}));