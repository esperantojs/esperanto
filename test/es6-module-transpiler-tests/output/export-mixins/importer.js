(function () {

	'use strict';

	var exporter = require('./exporter');
	
	assert.equal(exporter.default, 1);
	assert.equal(exporter.bar, 2);

}).call(global);