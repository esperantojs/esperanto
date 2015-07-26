define(['exports'], function (exports) { 'use strict';

	var baz = 4;

	exports.foo = 1;
	exports.bar = 2;

	exports.foo = 3;

	exports.qux = 5;
	exports.qux = 6;

	exports.baz = baz;

});
