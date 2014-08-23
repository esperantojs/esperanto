define(['exports','foo','bar','baz'],function (exports, __imports_0, __imports_1, __imports_2) {

	'use strict';
	
	var foo = __imports_0.default;
	var bar = __imports_1.default;
	var baz = __imports_2.default;
	
	var qux = foo( bar( baz ) );
	exports.default = qux;

});