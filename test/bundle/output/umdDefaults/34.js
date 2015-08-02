(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	global.myModule = factory();
}(this, function () { 'use strict';

	var exports = {};
	exports.bar = function () {
		console.log( 'exports should be renamed' );
	};

	var foo = exports;

	foo.bar();

	var main = 'whatever';

	return main;

}));
