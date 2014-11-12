var promise;

module.exports = function () {
	var libdir;

	if ( !promise ) {
		libdir = require( 'path' ).resolve( __dirname, '../lib' );

		promise = require( 'sander' ).rimraf( libdir ).then( function () {
			process.env.GOBBLE_ENV = 'test';

			return require( '../../gobble/lib' ).build({
				dest: libdir
			}).then( function () {
				return require( '../lib/esperanto' );
			});
		});
	}

	return promise;
};
