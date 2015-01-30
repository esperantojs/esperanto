define('foo', ['exports', 'foo'], function (exports, foo) {

	'use strict';



	exports.bar = foo.foo;

});