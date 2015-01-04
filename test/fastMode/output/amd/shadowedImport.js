define(['foo'], function () {

	'use strict';

	a();
	(function () {
		var foo = 'bar';
		a();
	}())

});