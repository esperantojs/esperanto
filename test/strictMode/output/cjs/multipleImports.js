(function () {

	'use strict';

	var __foo = require('foo');
	var __bar = require('bar');
	var __baz = require('baz');
	
	var qux = __foo.default( __bar.default( __baz.default ) );
	exports.default = qux;

}).call(global);