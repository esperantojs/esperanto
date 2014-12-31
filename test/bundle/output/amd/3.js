define(['external'], function (external) {

	'use strict';

	var external__default = ('default' in external ? external['default'] : external);

	var bar = 'yes';
	var foo__default = bar;

	console.log( external__default( foo__default ) );

});