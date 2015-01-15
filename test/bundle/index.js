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
			var tests = [
				{ entry: 'importer', dir: 'bare-import' },
				{ entry: 'importer', dir: 'bindings' },
				{ entry: 'c', dir: 'cycles' },
				{ entry: 'importer', dir: 'cycles-defaults' },
				{ entry: 'main', dir: 'cycles-immediate' },
				{ entry: 'importer', dir: 'duplicate-import-fails' },
				{ entry: 'importer', dir: 'duplicate-import-specifier-fails' },
				{ entry: 'second', dir: 'export-and-import-reference-share-var' },
				{ entry: 'importer', dir: 'export-default' },
				{ entry: 'importer', dir: 'export-default-function' },
				{ entry: 'importer', dir: 'export-default-named-function' },
				{ entry: 'third', dir: 'export-from' },
				{ entry: 'third', dir: 'export-from-default' },
				{ entry: 'importer', dir: 'export-function' },
				{ entry: 'importer', dir: 'export-list' },
				{ entry: 'importer', dir: 'export-mixins' },
				{ entry: 'index', dir: 'export-not-at-top-level-fails', expectedError: "'import' and 'export' may only appear at the top level" },
				{ entry: 'importer', dir: 'export-var' },
				{ entry: 'importer', dir: 'import-as' },
				{ entry: 'third', dir: 'import-chain' },
				{ entry: 'index', dir: 'import-not-at-top-level-fails', expectedError: "'import' and 'export' may only appear at the top level" },
				{ entry: 'mod', dir: 'module-level-declarations' },
				{ entry: 'importer', dir: 'named-function-expression' },
				{ entry: 'importer', dir: 'namespace-reassign-import-fails', expectedError: 'Cannot reassign imported binding of namespace `exp`' },
				{ entry: 'importer', dir: 'namespace-update-import-fails', expectedError: 'Cannot reassign imported binding of namespace `exp`' },
				{ entry: 'importer', dir: 'namespaces' },
				{ entry: 'third', dir: 're-export-default-import' },
				{ entry: 'importer', dir: 'reassign-import-fails', expectedError: 'Cannot reassign imported binding `x`' },
				{ entry: 'importer', dir: 'reassign-import-not-at-top-level-fails', expectedError: 'Cannot reassign imported binding `x`' },
				{ entry: 'mod', dir: 'this-binding-undefined' },
				{ entry: 'importer', dir: 'update-expression-of-import-fails', expectedError: 'Cannot reassign imported binding `a`' }
			];

			tests.forEach( function ( t ) {
				var cjs;

				it( t.dir, function () {
					// Create CommonJS modules, then require the entry module
					return esperanto.bundle({
						base: path.resolve( 'es6-module-transpiler-tests/input', t.dir ),
						entry: t.entry
					})
					.then( function ( bundle ) {
						cjs = bundle.toCjs({ strict: true }).code;
						return sander.writeFile( 'es6-module-transpiler-tests/bundled-output', t.dir + '.js', cjs );
					})
					.then( function () {
						var missingError;

						try {
							require( path.resolve( 'es6-module-transpiler-tests/bundled-output', t.dir ) );
							if ( t.expectedError ) {
								missingError = true;
							}
						} catch( err ) {
							if ( !t.expectedError || !~err.message.indexOf( t.expectedError ) ) {
								console.log( 'bundle>>>\n%s\n<<<', cjs );
								throw err;
							}
						}

						if ( missingError ) {
							console.log( 'bundle>>>\n%s\n<<<', cjs );
							throw new Error( 'Expected error "' + t.expectedError + '"' );
						}
					}, function ( err ) {
						if ( !t.expectedError || !~err.message.indexOf( t.expectedError ) ) {
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

					it( config.description, function () {
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
