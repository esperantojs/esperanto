(function (global, factory) {
	typeof define === 'function' && define.amd ? define(['exports'], factory) :
	typeof exports === 'object' ? factory(exports) :
	(global.myModule = {}, factory(global.myModule))
}(this, function (exports) { 'use strict';

	class Foo {
		constructor( str ) {
			this.str = str;
		}

		toString() {
			return this.str;
		}
	}

	exports['default'] = Foo;

}));