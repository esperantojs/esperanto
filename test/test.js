var fs = require( 'fs' ),
	path = require( 'path' ),
	promo = require( 'promo' ),
	Promise = promo.Promise,
	glob = promo( require( 'glob' ) ),
	mkdirp = promo( require( 'mkdirp' ) ),
	rimraf = promo( require( 'rimraf' ), {}),
	readFile = promo( fs.readFile ),
	writeFile = promo( fs.writeFile ),
	mapSeries = require( 'promise-map-series' ),

	args, generate;

require( 'colors' );

var args = process.argv.slice( 2 );
if ( args[0] === 'generate' ) {
	generate = true;
	args.shift();
}

if ( args[0] ) {
	esperanto = require( args[0] );
} else {
	esperanto = require( '../lib/esperanto' );
}

var profiles = {
	amd: {
		method: 'toAmd',
		options: {}
	},
	cjs: {
		method: 'toCjs',
		options: {}
	},
	amdDefaults: {
		method: 'toAmd',
		options: { defaultOnly: true }
	},
	cjsDefaults: {
		method: 'toCjs',
		options: { defaultOnly: true }
	}
};


if ( generate ) {
	glob( 'output/*' ).then( function ( result ) {
		return Promise.all([
			result.map( function ( file ) {
				return rimraf( file );
			})
		]);
	}).then( run );
} else {
	run();
}

function run () {
	glob( path.join( __dirname, 'input/**/*.js' ) ).then( function ( inputs ) {
		return mapSeries( Object.keys( profiles ), function ( id ) {
			var profile = profiles[ id ];

			return mapSeries( inputs, function ( input ) {
				var output = input.replace( 'input', 'output/' + id );

				return readFile( input ).then( function ( result ) {
					var generated;

					try {
						generated = esperanto[ profile.method ]( result.toString(), profile.options );

						if ( generate ) {
							return mkdirp( path.dirname( output ) ).then( function () {
								writeFile( output, generated );
							});
						}

						return readFile( output ).then( function ( result ) {
							var expected = result.toString();

							if ( expected === generated ) {
								process.stdout.write( '.' );
							} else {
								throw {
									failed: true,
									expected: expected,
									actual: generated,
									profileId: id,
									filename: input
								};
							}
						});
					} catch ( err ) {
						if ( !/defaultOnly/.test( err ) ) {
							throw err;
						}
					}

				});
			});
		});
	}).then( function () {
		process.stdout.write( 'done!\n' );
	}).catch( function ( err ) {
		if ( err.failed ) {
			console.error( ( 'Failed with ' + err.filename + ' and profile ' + err.profileId + ':\n' ).red );
			console.error( '=========='.red );
			console.error( 'Expected:\n'.cyan + err.expected + '\n' );
			console.error( 'Actual:\n'.cyan + err.actual );
			console.error( '=========='.red );
			process.exit( 1 );
		}

		console.log( err.message || err );
		process.exit( 1 );
	});
}
