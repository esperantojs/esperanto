define(['foo','bar','baz','exports'],function (__imports_0, __imports_1, __imports_2, exports) {

	'use strict';
	
	var foo = __imports_0.default;
	var bar = __imports_1.default;
	var baz = __imports_2.default;
	
	var qux = foo( bar( baz ) );
	exports.default = qux

});