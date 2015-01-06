(function (global, factory) {
	typeof define === 'function' && define.amd ? define([], factory) :
	typeof exports === 'object' ? module.exports = factory() :
	global.myModule = factory()
}(this, function () { 'use strict';

	class Foo {
		constructor( str ) {
			this.str = str;
		}

		toString() {
			return this.str;
		}
	}

	return Foo;

}));