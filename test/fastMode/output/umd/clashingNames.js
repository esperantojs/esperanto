(function (global, factory) {

	'use strict';

	if (typeof define === 'function' && define.amd) {
		// export as AMD
		define(['foo'], factory);
	} else if (typeof module !== 'undefined' && module.exports && typeof require === 'function') {
		// node/browserify
		module.exports = factory(require('foo'));
	} else {
		// browser global
		global.myModule = factory();
	}

}(typeof window !== 'undefined' ? window : this, function () {

	'use strict';

	var foo = 'should not clash';

	bar();

}));