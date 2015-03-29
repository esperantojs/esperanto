define(['foo', 'bar'], function (foo, _bar) {

	'use strict';

	foo = ('default' in foo ? foo['default'] : foo);
	_bar = ('default' in _bar ? _bar['default'] : _bar);



	(function () {
		var bar = 'nope';
		_bar();
	})();



});