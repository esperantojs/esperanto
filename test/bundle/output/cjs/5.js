(function () {

	'use strict';

	var numbers__one = 1;
	var numbers__two = 2;
	var numbers__three = 3;

	var main__four = numbers__one + 3;
	var main__five = numbers__two + 3;
	var main__six = numbers__three + 3;



	(function (__export) {
		__export('four', function () { return main__four; });
	__export('five', function () { return main__five; });
	__export('six', function () { return main__six; });
	}(function (prop, get) {
		Object.defineProperty(exports, prop, {
			enumerable: true,
			get: get
		});
	}));

}).call(global);