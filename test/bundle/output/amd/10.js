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

	exports['default'] = Foo;

});