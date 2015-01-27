define('foo', ['exports'], function (exports) {

	'use strict';

	var foo = "bar";

	if (false) {
		someFunction = function foo() {  };
	}

	exports.foo = foo;

});