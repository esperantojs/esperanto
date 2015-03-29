'use strict';

var foo = require('foo');
var _bar = require('bar');



(function () {
	var bar = 'nope';
	_bar();
})();

