(function () {

	'use strict';

	/* jshint esnext:true */
	
	var first__a = 1;
	assert.equal(first__a, 1);

	/* jshint esnext:true */
	
	var second__a_ = first__a, second__b = 9, second__c = 'c';
	
	assert.equal(first__a, 1);
	assert.equal(second__a_, 1);
	assert.equal(second__b, 9);
	assert.equal(second__c, 'c');



	(function (__export) {
		__export('b', function () { return second__b; });
	}(function (prop, get) {
		Object.defineProperty(exports, prop, {
			enumerable: true,
			get: get
		});
	}));

}).call(global);