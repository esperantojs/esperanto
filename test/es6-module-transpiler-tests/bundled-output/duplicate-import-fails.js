(function () {

	'use strict';

	/* jshint esnext:true */

	var a = 1;

	/* jshint esnext:true */

	/* error: type=SyntaxError message="expected one declaration for `a`, at importer.js:7:14 but found 2" */
	assert.equal(a, 1);

}).call(global);