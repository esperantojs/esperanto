(function () {

	'use strict';

	/* jshint esnext:true */
	
	var b__default = { b: 2, get a() { return a__default.a; } };

	/* jshint esnext:true */
	
	var a__default = { a: 1, get b() { return b__default.b; } };

	/* jshint esnext:true */
	
	assert.equal(a__default.a, 1);
	assert.equal(a__default.b, 2);
	assert.equal(b__default.a, 1);
	assert.equal(b__default.b, 2);

}).call(global);