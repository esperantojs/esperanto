(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(require('../../foo'), require('../bar'), require('./baz')) :
	typeof define === 'function' && define.amd ? define('my/nested/module', ['foo', 'my/bar', 'my/nested/baz'], factory) :
	factory(global.foo, global.bar, global.baz)
}(this, function (foo, bar, baz) { 'use strict';

}));