define(['exports'], function (exports) {

	'use strict';

	class Foo {
		constructor( str ) {
			this.str = str;
		}

		toString() {
			return this.str;
		}
	}
	var main = Foo;

	exports['default'] = main;

});