var path = require( 'path' ),
	assert = require( 'assert' ),
	sander = require( 'sander' ),
	Promise = sander.Promise,
	makeWhitespaceVisible = require( '../utils/makeWhitespaceVisible' ),
	esperanto;

global.assert = assert;

module.exports = function () {
	describe( 'strict mode', function () {
		var tests;

		tests = [
			{ file: 'earlyExport', description: 'transpiles exports that are not the final statement' },
			{ file: 'emptyImport', description: 'transpiles empty imports with no exports' },
			{ file: 'emptyImportWithDefaultExport', description: 'transpiles empty imports with default exports' },
			{ file: 'escapedSource', description: 'preserves character escapes in source strings' },
			{ file: 'exportAnonFunction', description: 'transpiled anonymous default function exports' },
			{ file: 'exportDefault', description: 'transpiles default exports' },
			{ file: 'exportInlineFunction', description: 'transpiles named inline function exports' },
			{ file: 'exportClass', description: 'transpiles named class exports as late exports' },
			{ file: 'exportLet', description: 'transpiles named inline let exports' },
			{ file: 'exportNamed', description: 'transpiles named exports' },
			{ file: 'exportVar', description: 'transpiles named inline variable exports' },
			{ file: 'importAll', description: 'transpiles import * as foo from "foo"' },
			{ file: 'importDefault', description: 'transpiles default imports' },
			{ file: 'importNamed', description: 'transpiles named imports' },
			{ file: 'mixedImports', description: 'transpiles mixed named/default imports' },
			{ file: 'multipleImports', description: 'transpiles multiple imports' },
			{ file: 'renamedImport', description: 'transpiles renamed imports' },
			{ file: 'trailingEmptyImport', description: 'transpiles trailing empty imports' },
			{ file: 'clashingNames', description: 'avoids naming collisions' },
			{ file: 'shadowedImport', description: 'handles shadowed imports' },
			{ file: 'constructor', description: 'handles `constructor` edge case' },
			{ file: 'namedAmdModule', description: 'creates a named AMD module if amdName is passed' },
			{ file: 'exportNamedFunction', description: 'named functions are exported early' }
		];

		tests.forEach( function ( t ) {
			try {
				t.config = require( '../samples/config/' + t.file );
			} catch ( err ) {
				t.config = {};
			}

			t.file += '.js',
			t.source = sander.readFileSync( 'samples', t.file ).toString();
		});

		before( function () {
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
				it( t.description, function () {
					var actual = esperanto[ method ]( t.source, {
						name: 'myModule',
						strict: true,
						amdName: t.config.amdName
					}).code;

					return sander.readFile( 'strictMode/output/' + dir, t.file ).then( String ).then( function ( expected ) {
						assert.equal( actual, expected, 'Expected\n>\n' +
							makeWhitespaceVisible( actual ) +
						'\n>\n\nto match\n\n>\n' +
							makeWhitespaceVisible( expected ) +
						'\n>' );
					}, function ( err ) {
						if ( err.code === 'ENOENT' ) {
							assert.equal( actual, '', 'Expected\n>\n' +
								makeWhitespaceVisible( actual ) +
							'\n>\n\nto match non-existent file' );
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

				it( dir, function () {
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
					}, function ( err ) {
						if ( !config.expectedError || !~err.message.indexOf( config.expectedError ) ) {
							throw err;
						}
					});
				});
			});
		});
	});
};
