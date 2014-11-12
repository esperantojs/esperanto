(function () {

	'use strict';

	var exporter = require('./exporter');
	
	assert.strictEqual(exporter.default(), 1);
	assert.strictEqual(exporter.callsFoo(), 1);

}).call(global);