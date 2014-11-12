(function () {

	'use strict';

	var external = require('external');
	var external__default = ('default' in external ? external.default : external);

	var foo__bar = 'yes';
	var foo__default = foo__bar;

	console.log( external__default( foo__default ) );

}).call(global);