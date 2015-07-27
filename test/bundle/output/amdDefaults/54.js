define(['bluebird'], function (_Promise) { 'use strict';

	_Promise = 'default' in _Promise ? _Promise['default'] : _Promise;

	var foo = 'foo';

	_Promise.resolve( foo ).then( function ( foo ) {
		console.log( foo );
	});

});
