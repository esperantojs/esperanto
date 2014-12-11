define(['foo'], function (_foo) {

	'use strict';

	var foo = 'should not clash';

	_foo.bar();

});