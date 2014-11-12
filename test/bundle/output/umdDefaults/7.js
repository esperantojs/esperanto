(function (global, factory) {

	'use strict';

	if (typeof define === 'function' && define.amd) {
		// export as AMD
		define([], factory);
	} else if (typeof module !== 'undefined' && module.exports && typeof require === 'function') {
		// node/browserify
		module.exports = factory();
	} else {
		// browser global
		global.myModule = factory();
	}

}(typeof window !== 'undefined' ? window : this, function () {

	'use strict';

	var foo__default = 'this is foo';

	function main__logFoo () {
		console.log( foo__default );
	}
	
	function main__logBar () {
		console.log( bar__default );
	}

}));