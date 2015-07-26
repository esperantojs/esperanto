'use strict';

var foo = require('foo');
foo = 'default' in foo ? foo['default'] : foo;
var _bar = require('bar');
_bar = 'default' in _bar ? _bar['default'] : _bar;



(function () {
	var bar = 'nope';
	_bar();
})();

