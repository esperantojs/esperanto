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

	var a__foo = 1;
	var a__bar = 2;

	exports.foo = a__foo = 3;

	exports.bar = a__bar;

	var baz__default = 4;

	exports.baz = baz__default;

	var main__qux = 5;
	exports.qux = main__qux = 6;

}));