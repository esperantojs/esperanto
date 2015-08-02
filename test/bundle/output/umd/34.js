(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
	typeof define === 'function' && define.amd ? define(['exports'], factory) :
	factory((global.myModule = {}));
}(this, function (exports) { 'use strict';

	var _exports = {};
	_exports.bar = function () {
		console.log( 'exports should be renamed' );
	};

	var foo = _exports;

	foo.bar();

	var main = 'whatever';

	exports['default'] = main;

}));
