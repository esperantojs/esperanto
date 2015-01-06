(function (global, factory) {
	typeof define === 'function' && define.amd ? define(['foo', 'polyfills'], factory) :
	typeof exports === 'object' ? module.exports = factory(require('foo'), require('polyfills')) :
	global.myModule = factory(global.foo)
}(this, function (foo) { 'use strict';

	'use strict';

	return 'baz';

}));