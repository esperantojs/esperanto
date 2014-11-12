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
		factory(global.external);
	}

}(typeof window !== 'undefined' ? window : this, function (external) {

	'use strict';

	var external__default = ('default' in external ? external.default : external);

	var foo__bar = 'yes';
	var foo__default = foo__bar;

	console.log( external__default( foo__default ) );

});