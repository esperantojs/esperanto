(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(require('bluebird')) :
	typeof define === 'function' && define.amd ? define(['bluebird'], factory) :
	factory(global.Promise);
}(this, function (_Promise) { 'use strict';

	_Promise = 'default' in _Promise ? _Promise['default'] : _Promise;

	var foo = 'foo';

	_Promise.resolve( foo ).then( function ( foo ) {
		console.log( foo );
	});

}));
