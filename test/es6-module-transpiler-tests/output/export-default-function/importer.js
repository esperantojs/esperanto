(function () {

	'use strict';

	var fn1 = require('./exporter');
	var fn1 = require('./exporter');

	/* jshint esnext:true */

	assert.equal(fn1.default(), 1);
	assert.equal(fn1.default(), 1);

}).call(global);