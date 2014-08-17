(function ( global, factory ) {

	'use strict';

	if ( typeof define === 'function' && define.amd ) {
		define([ 'acorn' ], factory );
	} else if ( typeof module !== 'undefined' && module.exports ) {
		module.exports = factory( require( 'acorn' ) );
	} else {
		global.esperanto = factory( global.acorn );
	}

}( typeof window !== 'undefined' ? window : this, function ( acorn ) {

	'use strict';
	
