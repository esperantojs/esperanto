define(function () { 'use strict';

	var foo = {
		get y () { return x; }
	};

	var x = 42;

	console.log( foo.y );

});
