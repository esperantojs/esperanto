(function (global, factory) {

	'use strict';

	if (typeof define === 'function' && define.amd) {
		// export as AMD
		define(['foo', 'bar', 'baz'], factory);
	} else if (typeof module !== 'undefined' && module.exports && typeof require === 'function') {
		// node/browserify
		module.exports = factory(require('foo'), require('bar'), require('baz'));
	} else {
		// browser global
		global.myModule = factory(global.foo, global.bar, global.baz);
	}

}(typeof window !== 'undefined' ? window : this, function (foo, bar, baz) {

	'use strict';
	
	var qux = foo( bar( baz ) );
	
	return qux;

}));