var path = require( 'path' ),
	assert = require( 'assert' ),
	sander = require( 'sander' ),
	Promise = sander.Promise,
	makeWhitespaceVisible = require( '../utils/makeWhitespaceVisible' ),
	esperanto;

global.assert = assert;

module.exports = function () {
	describe( 'esperanto.bundle()', function () {
		var profiles;

		before( function () {
			return Promise.all([
				require( '../utils/build' )().then( function ( lib ) {
					esperanto = lib;
				}),

				sander.rimraf( 'es6-module-transpiler-tests/bundled-output' )
			]);
		});

		describe( 'ES6 module semantics tests from es6-module-transpiler:', function () {
			sander.readdirSync( __dirname, '../es6-module-transpiler-tests/input' ).forEach( function ( dir ) {
				var config, cjs;

				config = require( '../es6-module-transpiler-tests/input/' + dir + '/_config' );

				it( dir, function () {
					// Create CommonJS modules, then require the entry module
					return esperanto.bundle({
						base: path.resolve( 'es6-module-transpiler-tests/input', dir ),
						entry: config.entry
					})
					.then( function ( bundle ) {
						cjs = bundle.toCjs({ strict: true }).code;
						return sander.writeFile( 'es6-module-transpiler-tests/bundled-output', dir + '.js', cjs );
					})
					.then( function () {
						var missingError;

						try {
							require( path.resolve( 'es6-module-transpiler-tests/bundled-output', dir ) );
							if ( config.expectedError ) {
								missingError = true;
							}
						} catch( err ) {
							if ( !config.expectedError || !~err.message.indexOf( config.expectedError ) ) {
								console.log( 'bundle>>>\n%s\n<<<', cjs );
								throw err;
							}
						}

						if ( missingError ) {
							console.log( 'bundle>>>\n%s\n<<<', cjs );
							throw new Error( 'Expected error "' + config.expectedError + '"' );
						}
					}, function ( err ) {
						if ( !config.expectedError || !~err.message.indexOf( config.expectedError ) ) {
							console.log( 'bundle>>>\n%s\n<<<', cjs );
							throw err;
						}
					});
				});
			});
		});

		profiles = [
			{ description: 'bundle.concat()', method: 'concat', outputdir: 'concat' },
			{ description: 'bundle.toAmd()', method: 'toAmd', outputdir: 'amdDefaults' },
			{ description: 'bundle.toUmd()', method: 'toUmd', outputdir: 'umdDefaults', options: { name: 'myModule' } },
			{ description: 'bundle.toCjs()', method: 'toCjs', outputdir: 'cjsDefaults' },
			{ description: 'bundle.toAmd({ strict: true })', method: 'toAmd', outputdir: 'amd', options: { strict: true } },
			{ description: 'bundle.toUmd({ strict: true })', method: 'toUmd', outputdir: 'umd', options: { strict: true, name: 'myModule' } },
			{ description: 'bundle.toCjs({ strict: true })', method: 'toCjs', outputdir: 'cjs', options: { strict: true } }
		];

		profiles.forEach( function ( profile ) {
			describe( profile.description + ':', function () {
				sander.readdirSync( __dirname, 'input' ).forEach( function ( dir ) {
					var config = require( './input/' + dir + '/_config' );

					( config.solo ? it.only : it )( config.description, function () {
						return esperanto.bundle({
							base: path.resolve( 'bundle/input', dir ),
							entry: config.entry || 'main',
							skip: config.skip,
							names: config.names,
							transform: config.transform
						}).then( function ( bundle ) {
							var options, actual;

							options = profile.options || {};

							actual = bundle[ profile.method ]({
								strict: options.strict,
								name: options.name,
								amdName: config.amdName,
								banner: config.banner,
								footer: config.footer
							}).code;

							return sander.readFile( 'bundle/output/', profile.outputdir, dir + '.js' ).then( String ).then( function ( expected ) {
								if ( config.error ) {
									throw new Error( 'No error was raised' );
								}

								if ( config.strict && !options.strict ) {
									throw new Error( 'Test should fail in non-strict mode' );
								}

								assert.equal( actual, expected, 'Expected\n>\n' +
									makeWhitespaceVisible( actual ) +
								'\n>\n\nto match\n\n>\n' +
									makeWhitespaceVisible( expected ) +
								'\n>' );
							}).catch( function ( err ) {
								if ( err.code === 'ENOENT' ) {
									assert.equal( actual, '', 'Expected\n>\n' +
										makeWhitespaceVisible( actual ) +
									'\n>\n\nto match non-existent file' );
								} else {
									throw err;
								}
							});
						}).catch( function ( err ) {
							// strict mode tests should fail
							if ( /strict mode/.test( err.message ) && config.strict ) {
								return;
							}

							if ( /bundles that have no imports\/exports/.test( err.message ) && profile.method === 'concat' ) {
								return;
							}

							if ( !config.error ) {
								throw err;
							}

							if ( config.error instanceof RegExp ) {
								if ( !config.error.test( err.message ) ) {
									throw err;
								}
							} else if ( !config.error( err ) ) {
								throw err;
							}
						});
					});
				});
			});
		});
	});
};
