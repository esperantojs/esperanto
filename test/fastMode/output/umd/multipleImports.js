(function (global, factory) {
	typeof define === 'function' && define.amd ? define(['foo', 'bar', 'baz'], factory) :
	typeof exports === 'object' ? module.exports = factory(require('foo'), require('bar'), require('baz')) :
	global.myModule = factory(global.foo, global.bar, global.baz)
}(this, function (foo, bar, baz) { 'use strict';

	'use strict';

	var qux = foo( bar( baz ) );

	return qux;

}));