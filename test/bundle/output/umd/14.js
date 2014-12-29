(function (global, factory) {

	'use strict';

	if (typeof define === 'function' && define.amd) {
		// export as AMD
		define(['external'], factory);
	} else if (typeof module !== 'undefined' && module.exports && typeof require === 'function') {
		// node/browserify
		factory(require('external'));
	} else {
		// browser global
		global.myModule = {};
		factory(global.foo);
	}

}(typeof window !== 'undefined' ? window : this, function (foo) {

	'use strict';

	var foo__default = ('default' in foo ? foo['default'] : foo);

	foo__default();

}));