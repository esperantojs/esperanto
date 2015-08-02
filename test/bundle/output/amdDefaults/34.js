define(function () { 'use strict';

	var exports = {};
	exports.bar = function () {
		console.log( 'exports should be renamed' );
	};

	var foo = exports;

	foo.bar();

	var main = 'whatever';

	return main;

});
