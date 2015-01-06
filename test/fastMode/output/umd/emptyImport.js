(function (global, factory) {
	typeof define === 'function' && define.amd ? define(['foo', 'polyfills'], factory) :
	typeof exports === 'object' ? factory(require('foo'), require('polyfills')) :
	factory(global.bar)
}(this, function (bar) { 'use strict';

	'use strict';

}));