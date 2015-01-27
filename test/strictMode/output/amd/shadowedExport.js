define(['exports'], function (exports) {

	'use strict';

	exports.foo = foo;

	function foo () { }

	function bar() {
		var foo;

		foo = "qux";
	}

});