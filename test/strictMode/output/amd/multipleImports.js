define(['exports', 'foo', 'bar', 'baz'], function (exports, __foo, __bar, __baz) {

	'use strict';

	var qux = __foo.default( __bar.default( __baz.default ) );
	exports.default = qux;

});