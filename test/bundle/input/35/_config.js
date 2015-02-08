var path = require( 'path' );
var Promise = require( 'sander' ).Promise;
var resolve = require( 'resolve' );

module.exports = {
	description: 'External module paths can be resolved with resolvePath option',
	resolvePath: function ( importee, importer ) {
		return new Promise( function ( fulfil, reject ) {
			var callback = function ( err, result ) {
				if ( err ) {
					reject( err );
				} else {
					fulfil( result );
				}
			};

			resolve( importee, {
				basedir: path.dirname( importer ),
				moduleDirectory: 'js_modules', // to avoid faffing with .gitignore
				packageFilter: function ( pkg ) {
					if ( pkg[ 'jsnext:main' ] ) {
						pkg.main = pkg[ 'jsnext:main' ];
					}

					return pkg;
				}
			}, callback );
		});
	}
};