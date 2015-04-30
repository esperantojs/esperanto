var path = require( 'path' );

module.exports = {
	description: 'allows imported bindings to share names with builtins',
	resolvePath: function ( importee ) {
		return path.resolve( __dirname, 'external', importee.slice( 4 ) ) + '.js';
	}
};