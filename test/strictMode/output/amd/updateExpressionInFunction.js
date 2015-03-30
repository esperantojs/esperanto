define(['exports'], function (exports) {

	'use strict';

	exports.incr = incr;

	var a = 1;

	function incr () {
		var b = a++; exports.num = a;
		console.log( 'incremented from %s to %s', b, a );
	}

	exports.num = a;

});