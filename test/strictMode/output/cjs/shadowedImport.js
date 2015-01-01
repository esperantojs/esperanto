(function () {

	'use strict';

	var _foo = require('foo');

	_foo.a();
	(function () {
		var foo = 'bar';
		_foo.a();
	}())

}).call(global);