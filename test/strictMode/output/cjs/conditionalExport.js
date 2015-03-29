'use strict';

var foo = function () {};
var bar = 'a';

if ( false ) {
	foo = function () {
		exports.bar = bar = 'b';
	};
}

exports.foo = foo;
exports.bar = bar;