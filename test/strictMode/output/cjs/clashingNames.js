(function () {

	'use strict';

	var _foo = require('foo');

	var foo = 'should not clash';

	_foo.bar();

}).call(global);