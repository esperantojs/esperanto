module.exports = {
	description: 'throw error with file and location error if acorn cannot parse',
	error: function ( err ) {
		return err.file === require( 'path' ).resolve( __dirname, 'main.js' ) && err.loc.line === 1 && err.loc.column === 4;
	}
};