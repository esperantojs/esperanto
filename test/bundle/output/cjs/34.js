'use strict';

var _exports = {};
_exports.bar = function () {
	console.log( 'exports should be renamed' );
};

var foo = _exports;

foo.bar();

var main = 'whatever';

exports['default'] = main;
