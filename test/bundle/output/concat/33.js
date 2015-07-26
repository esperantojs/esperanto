(function () { 'use strict';

	var _Math = {
		get add () { return add; },
		get multiply () { return multiply; }
	};

	var _Promise = function () {};

	_Promise.prototype = {
		keep () { this.state = 'kept'; },
		break () { this.state = 'broken'; }
	};

	function add ( a, b ) {
		return a + b;
	}

	function multiply ( a, b ) {
		return a * b;
	}

	var num = Math.max( 1, 2, 3 );
	var resolved = Promise.resolve( num );

	function foo () {
		return resolved;
	}

	var promise = new _Promise();
	promise.keep();

	console.log( _Math.add( 40, 2 ) );

	foo().then( function ( num ) {
		console.log( num );
	});

})();
