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

	var one = 1;
	var two = 2;
	var three = 3;

	var four = one + 3;
	var five = two + 3;
	var six = three + 3;

	exports.four = four = 99;

	exports.five = five;
	exports.six = six;

}));