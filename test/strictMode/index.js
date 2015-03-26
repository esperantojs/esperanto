var path = require( 'path' ),
	assert = require( 'assert' ),
	sander = require( 'sander' ),
	Promise = sander.Promise,
	makeWhitespaceVisible = require( '../utils/makeWhitespaceVisible' ),
	esperanto;

global.assert = assert;

module.exports = function () {
	describe( 'strict mode', function () {
		this.timeout( 20000 );

		var tests = sander.readdirSync( __dirname, '../samples' ).map( function ( dir ) {
			var config = require( '../samples/' + dir + '/_config' ),
				source = sander.readFileSync( __dirname, '../samples', dir, 'source.js' ).toString();

			return {
				id: dir,
				config: config,
				source: source
			};
		});

		before( function () {
			if ( process.env.BUILD_TIMEOUT ) {
				this.timeout( parseInt( process.env.BUILD_TIMEOUT ) );
			}

			return sander.Promise.all([
				require( '../utils/build' )().then( function ( lib ) {
					esperanto = lib;
				}),

				sander.rimraf( 'es6-module-transpiler-tests/output' )
			]);
		});

		describe( 'esperanto.toAmd()', function () {
			runTests( 'amd', 'toAmd' );
		});

		describe( 'esperanto.toCjs()', function () {
			runTests( 'cjs', 'toCjs' );
		});

		describe( 'esperanto.toUmd()', function () {
			runTests( 'umd', 'toUmd' );
		});

		function runTests ( dir, method ) {
			tests.forEach( function ( t ) {
				( t.config.solo ? it.only : it )( t.config.description, function () {
					var transpiled;

					try {
						transpiled = esperanto[ method ]( t.source, {
							name: 'myModule',
							strict: true,
							amdName: t.config.amdName,
							absolutePaths: t.config.absolutePaths,
							banner: t.config.banner,
							footer: t.config.footer,
							_evilES3SafeReExports: t.config._evilES3SafeReExports
						});
					} catch ( err ) {
						if ( t.config.expectedError && ~err.message.indexOf( t.config.expectedError ) ) {
							return;
						}

						throw err;
					}

					if ( t.config.expectedError ) {
						throw new Error( 'Expected error: ' + t.config.expectedError );
					}

					var actual = makeWhitespaceVisible( transpiled.code );

					return sander.readFile( 'strictMode/output/' + dir, t.id + '.js' ).then( String ).then( function ( str ) {
						var expected = makeWhitespaceVisible( str );

						assert.equal( actual, expected, 'Expected\n>\n' + actual + '\n>\n\nto match\n\n>\n' + expected + '\n>' );
					}, function ( err ) {
						if ( err.code === 'ENOENT' ) {
							assert.equal( actual, '', 'Expected\n>\n' + actual + '\n>\n\nto match non-existent file' );
						} else {
							throw err;
						}
					});
				});
			});
		}

		describe( 'ES6 module semantics tests from es6-module-transpiler:', function () {
			sander.readdirSync( __dirname, '../es6-module-transpiler-tests/input' ).forEach( function ( dir ) {
				var config = require( '../es6-module-transpiler-tests/input/' + dir + '/_config' );

				( config.solo ? it.only : it )( dir, function () {
					// Create CommonJS modules, then require the entry module
					return sander.readdir( 'es6-module-transpiler-tests/input', dir ).then( function ( files ) {
						var promises = files.map( function ( file ) {
							if ( file === '_config.js' ) return;

							return sander.readFile( 'es6-module-transpiler-tests/input', dir, file ).then( String ).then( function ( source ) {
								var transpiled = esperanto.toCjs( source, {
									strict: true
								});

								return sander.writeFile( 'es6-module-transpiler-tests/output', dir, file, transpiled.code );
							});
						});

						return Promise.all( promises );
					})
					.then( function () {
						var missingError;

						try {
							require( path.resolve( 'es6-module-transpiler-tests/output', dir, config.entry ) );
							if ( config.expectedError ) {
								missingError = true;
							}
						} catch( err ) {
							if ( !config.expectedError || !~err.message.indexOf( config.expectedError ) ) {
								throw err;
							}
						}

						if ( missingError ) {
							throw new Error( 'Expected error "' + config.expectedError + '"' );
						}
					})
					.catch( function ( err ) {
						if ( !config.expectedError || !~err.message.indexOf( config.expectedError ) ) {
							throw err;
						}
					});
				});
			});
		});
	});
};
