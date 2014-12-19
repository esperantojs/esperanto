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
		factory(global.myModule, global.foo, global.bar, global.baz);
	}

}(typeof window !== 'undefined' ? window : this, function (exports, foo, bar, baz) {

	'use strict';

	var qux = foo['default']( bar['default']( baz['default'] ) );
	exports['default'] = qux;

}));