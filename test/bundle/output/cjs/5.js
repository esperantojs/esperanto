(function () {

	'use strict';

	var one = 1;
	var two = 2;
	var three = 3;

	var four = one + 3;
	var five = two + 3;
	var six = three + 3;



	(function (__export) {
		__export('four', function () { return four; });
	__export('five', function () { return five; });
	__export('six', function () { return six; });
	}(function (prop, get) {
		Object.defineProperty(exports, prop, {
			enumerable: true,
			get: get
		});
	}));

}).call(global);