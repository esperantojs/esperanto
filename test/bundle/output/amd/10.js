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
	var main__default = Foo;

	exports['default'] = main__default;

});