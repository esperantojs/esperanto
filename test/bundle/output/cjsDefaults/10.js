(function () {

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

	module.exports = main;

}).call(global);