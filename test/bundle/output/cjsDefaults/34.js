'use strict';

var _exports = {};
_exports.bar = function () {
	console.log( 'exports should be renamed' );
};

_exports.bar();

var main = 'whatever';

module.exports = main;
