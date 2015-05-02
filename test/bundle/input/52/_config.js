var path = require( 'path' );

module.exports = {
	description: 'correctly renames bindings from modules referred to by local and external-ish modules',
	resolvePath: function ( importee ) {
		return path.resolve( __dirname, 'external', importee.slice( 4 ) ) + '.js';
	}
};