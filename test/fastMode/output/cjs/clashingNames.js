(function () {

	'use strict';

	var undefined = require('foo');
	var foo = 'should not clash';

	bar();

}).call(global);