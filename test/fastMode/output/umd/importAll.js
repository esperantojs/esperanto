(function (global, factory) {

	'use strict';

	if (typeof define === 'function' && define.amd) {
		// export as AMD
		define(['fs'], factory);
	} else if (typeof module !== 'undefined' && module.exports && typeof require === 'function') {
		// node/browserify
		module.exports = factory(require('fs'));
	} else {
		// browser global
		global.myModule = factory(global.fs);
	}

}(typeof window !== 'undefined' ? window : this, function (fs) {

	'use strict';

}));