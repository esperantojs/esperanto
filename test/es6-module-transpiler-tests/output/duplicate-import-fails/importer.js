(function () {

	'use strict';

	var exporter = require('./exporter');
	var exporter = require('./exporter');
	
	/* jshint esnext:true */
	
	/* error: type=SyntaxError message="expected one declaration for `a`, at importer.js:7:14 but found 2" */
	assert.equal(exporter.a, 1);

}).call(global);