(function (global, factory) {
	typeof define === 'function' && define.amd ? define('myModule', ['foo'], factory) :
	typeof exports === 'object' ? factory(require('foo')) :
	factory(global.foo)
}(this, function (foo) { 'use strict';

	foo['default']();

}));