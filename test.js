var fs = require( 'fs' ),
	path = require( 'path' ),
	promo = require( 'promo' ),
	Promise = promo.Promise,
	glob = promo( require( 'glob' ) ),
	mkdirp = promo( require( 'mkdirp' ) ),
	rimraf = promo( require( 'rimraf' ), {}),
	readFile = promo( fs.readFile ),
	writeFile = promo( fs.writeFile ),

	esperanto = require( './index' );

var profiles = {
	amd: {
		method: 'toAmd',
		options: {}
	},
	cjs: {
		method: 'toCjs',
		options: {}
	}
};

glob( 'sample/output/*' ).then( function ( result ) {
	Promise.all([
		result.map( function ( file ) {
			return rimraf( file );
		})
	]).then( function () {
		glob( 'sample/input/**/*.js' ).then( function ( inputs ) {
			Object.keys( profiles ).forEach( function ( id ) {
				var profile = profiles[ id ];

				console.log( 'profile', profile );

				inputs.forEach( function ( input ) {
					readFile( input ).then( function ( result ) {
						var output, dest;

						output = esperanto[ profile.method ]( result.toString() );
						dest = input.replace( 'input', 'output/' + id );

						mkdirp( path.dirname( dest ) ).then( function () {
							writeFile( dest, output );
						});
					}).catch( function ( err ) {
						setTimeout( function () {
							throw err;
						});
					});
				});
			});


		});
	});
});
