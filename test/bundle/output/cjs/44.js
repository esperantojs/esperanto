'use strict';

var foo = require('foo');
foo = 'default' in foo ? foo['default'] : foo;
var _foo = require('bar');
_foo = 'default' in _foo ? _foo['default'] : _foo;

(function () {
	var bar = 'nope';
	_foo();
})();
