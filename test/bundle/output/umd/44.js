(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(require('foo'), require('bar')) :
	typeof define === 'function' && define.amd ? define(['foo', 'bar'], factory) :
	factory(global.foo, global._bar);
}(this, function (foo, _bar) { 'use strict';

	foo = 'default' in foo ? foo['default'] : foo;
	_bar = 'default' in _bar ? _bar['default'] : _bar;



	(function () {
		var bar = 'nope';
		_bar();
	})();



}));