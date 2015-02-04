(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(require('../../foo'), require('../bar'), require('./baz'), require('./../qux')) :
	typeof define === 'function' && define.amd ? define('my/nested/module', ['foo', 'my/bar', 'my/nested/baz', 'my/qux'], factory) :
	factory(global.foo, global.bar, global.baz, global.qux)
}(this, function (foo, bar, baz, qux) { 'use strict';

}));