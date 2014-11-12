(function (global, factory) {

	'use strict';

	if (typeof define === 'function' && define.amd) {
		// export as AMD
		define(['exports', 'foo', 'bar', 'baz'], factory);
	} else if (typeof module !== 'undefined' && module.exports && typeof require === 'function') {
		// node/browserify
		factory(exports, require('foo'), require('bar'), require('baz'));
	} else {
		// browser global
		global.myModule = {};
		factory(global.myModule, global.__foo, global.__bar, global.__baz);
	}

}(typeof window !== 'undefined' ? window : this, function (exports, __foo, __bar, __baz) {

	'use strict';

	var qux = __foo.default( __bar.default( __baz.default ) );
	exports.default = qux;

}));