define(['foo', 'bar'], function (foo, _foo) { 'use strict';

	foo = 'default' in foo ? foo['default'] : foo;
	_foo = 'default' in _foo ? _foo['default'] : _foo;

	var a = foo;

	(function () {
		var bar = 'nope';
		_foo();
	})();

});
