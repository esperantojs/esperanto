(function () {

	'use strict';

	var foo = 'bar';
	exports.foo = foo = 'baz';

}).call(global);