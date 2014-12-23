(function () {

	'use strict';

	/* jshint esnext:true */

	var a = 1;
	var __b = 2;
	assert.equal(a, 1);
	assert.equal(__b, 2);

	/* jshint esnext:true */

	assert.equal(a, 1);

	// `b` was not exported from "exporter"
	assert.equal(typeof b, 'undefined');

}).call(global);