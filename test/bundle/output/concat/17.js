(function () { 'use strict';

	function foo__a ( message ) {
		console.log( message );
	}

	foo__a();
	(function () {
		var a = 'c';
		foo__a( a );
	}());

})();