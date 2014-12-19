define(['exports', 'foo', 'bar', 'baz'], function (exports, foo, bar, baz) {

	'use strict';

	var qux = foo['default']( bar['default']( baz['default'] ) );
	exports['default'] = qux;

});