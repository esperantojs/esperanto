(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
	typeof define === 'function' && define.amd ? define(['exports'], factory) :
	factory((global.myModule = {}));
}(this, function (exports) { 'use strict';

	var foo__exports = {};
	foo__exports.bar = function () {
		console.log( 'exports should be renamed' );
	};

	var foo = foo__exports;

	foo.bar();

	var main = 'whatever';

	exports['default'] = main;

}));
