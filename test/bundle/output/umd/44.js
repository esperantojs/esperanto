(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(require('foo'), require('bar')) :
	typeof define === 'function' && define.amd ? define(['foo', 'bar'], factory) :
	factory(global.foo,global._foo);
}(this, function (foo,_foo) { 'use strict';

	foo = 'default' in foo ? foo['default'] : foo;
	_foo = 'default' in _foo ? _foo['default'] : _foo;

	(function () {
		var bar = 'nope';
		_foo();
	})();

}));
