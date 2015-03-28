define(['exports'], function (exports) {

	'use strict';

	var foo = 1;
	var bar = 2;

	foo = 3;

	exports.foo = foo;
	exports.bar = bar;

	var baz = 4;

	exports.baz = baz;

	var qux = 5;
	qux = 6;

	exports.qux = qux;

});