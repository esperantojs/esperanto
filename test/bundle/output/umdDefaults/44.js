(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(require('foo'), require('bar')) :
	typeof define === 'function' && define.amd ? define(['foo', 'bar'], factory) :
	factory(global.foo, global._bar)
}(this, function (foo, _bar) { 'use strict';



	(function () {
		var bar = 'nope';
		_bar();
	})();



}));