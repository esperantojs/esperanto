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
		factory(global.ImplicitlyNamed);
	}

}(typeof window !== 'undefined' ? window : this, function (ImplicitlyNamed) {

	'use strict';

	var ImplicitlyNamed__default = ('default' in ImplicitlyNamed ? ImplicitlyNamed.default : ImplicitlyNamed);

});