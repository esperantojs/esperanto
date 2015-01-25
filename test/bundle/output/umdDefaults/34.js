(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	global.myModule = factory()
}(this, function () { 'use strict';

	var foo__exports = {};
	foo__exports.bar = function () {
		console.log( 'exports should be renamed' );
	};

	var foo = foo__exports;

	foo.bar();

	var main = 'whatever';

	return main;

}));