define(function () { 'use strict';

	var foo__exports = {};
	foo__exports.bar = function () {
		console.log( 'exports should be renamed' );
	};

	var foo = foo__exports;

	foo.bar();

	var main = 'whatever';

	return main;

});
