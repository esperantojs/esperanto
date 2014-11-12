define(['foo', 'bar', 'baz'], function (foo, bar, baz) {

	'use strict';
	
	var qux = foo( bar( baz ) );
	
	return qux;

});