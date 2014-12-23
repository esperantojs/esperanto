define(['exports'], function (exports) {

	'use strict';

	class main__Foo {
		constructor( str ) {
			this.str = str;
		}

		toString() {
			return this.str;
		}
	}
	var main__default = main__Foo;

	exports['default'] = main__default;

});