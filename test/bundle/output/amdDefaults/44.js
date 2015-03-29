define(['foo', 'bar'], function (foo, _bar) {

	'use strict';



	(function () {
		var bar = 'nope';
		_bar();
	})();



});