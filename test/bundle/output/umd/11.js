(function (global, factory) {

	'use strict';

	if (typeof define === 'function' && define.amd) {
		// export as AMD
		define(['exports'], factory);
	} else if (typeof module !== 'undefined' && module.exports && typeof require === 'function') {
		// node/browserify
		factory(exports);
	} else {
		// browser global
		global.myModule = {};
		factory(global.myModule);
	}

}(typeof window !== 'undefined' ? window : this, function (exports) {

	'use strict';

	var foo = 1;
	var bar = 2;

	exports.foo = foo = 3;

	exports.bar = bar;

	var baz = 4;

	exports.baz = baz;

	var qux = 5;
	exports.qux = qux = 6;

}));