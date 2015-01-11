define(['external'], function (external) {

	'use strict';

	var bar = 'yes';
	var foo = bar;

	console.log( external( foo ) );

});