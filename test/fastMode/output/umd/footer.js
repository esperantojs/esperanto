(function (global, factory) {

	'use strict';

	if (typeof define === 'function' && define.amd) {
		// export as AMD
		define(['whatever'], factory);
	} else if (typeof module !== 'undefined' && module.exports && typeof require === 'function') {
		// node/browserify
		module.exports = factory(require('whatever'));
	} else {
		// browser global
		global.myModule = factory(global.whatever);
	}

}(typeof window !== 'undefined' ? window : this, function (whatever) {

	'use strict';

	whatever();


	return 'someExport';

}));