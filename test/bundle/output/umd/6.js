(function (global, factory) {

	'use strict';

	if (typeof define === 'function' && define.amd) {
		// export as AMD
		define(['utils/external'], factory);
	} else if (typeof module !== 'undefined' && module.exports && typeof require === 'function') {
		// node/browserify
		factory(require('utils/external'));
	} else {
		// browser global
		global.myModule = {};
		factory(global.external);
	}

}(typeof window !== 'undefined' ? window : this, function (external) {

	'use strict';

	var external__default = ('default' in external ? external.default : external);

	var message__default = 'this is a message';

	console.log( message__default );

});