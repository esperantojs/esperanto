(function () {

	'use strict';
	
	var foo = require('foo');
	var bar = require('bar');
	var baz = require('baz');
	
	var qux = foo( bar( baz ) );
	module.exports = qux;

}).call(global);