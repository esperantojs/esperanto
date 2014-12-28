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

	var numbers__one = 1;
	var numbers__two = 2;
	var numbers__three = 3;

	var main__four = numbers__one + 3;
	var main__five = numbers__two + 3;
	var main__six = numbers__three + 3;

	exports.four = main__four = 99;

	exports.five = main__five;
	exports.six = main__six;

}));