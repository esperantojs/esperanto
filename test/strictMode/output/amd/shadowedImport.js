define(['foo'], function (_foo) {

	'use strict';

	_foo.a();
	(function () {
		var foo = 'bar';
		_foo.a();
	}())

});