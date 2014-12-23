(function () {

	'use strict';

	/* jshint esnext:true */

	var a = 1;
	assert.equal(a, 1);

	/* jshint esnext:true */

	var a_ = a, b = 9, c = 'c';

	assert.equal(a, 1);
	assert.equal(a_, 1);
	assert.equal(b, 9);
	assert.equal(c, 'c');



	(function (__export) {
		__export('b', function () { return b; });
	}(function (prop, get) {
		Object.defineProperty(exports, prop, {
			enumerable: true,
			get: get
		});
	}));

}).call(global);