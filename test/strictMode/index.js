var path = require( 'path' ),
	assert = require( 'assert' ),
	sander = require( 'sander' ),
	Promise = sander.Promise,
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
				//{ entry: 'third', dir: 'export-from-default' }, // pending https://github.com/marijnh/acorn/pull/15
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
				it( t.dir, function () {
					// Create CommonJS modules, then require the entry module
					return sander.readdir( 'es6-module-transpiler-tests/input', t.dir ).then( function ( files ) {
						var promises = files.map( function ( file ) {
							return sander.readFile( 'es6-module-transpiler-tests/input', t.dir, file ).then( String ).then( function ( source ) {
								var transpiled = esperanto.toCjs( source, {
									strict: true
								});

								return sander.writeFile( 'es6-module-transpiler-tests/output', t.dir, file, transpiled.code );
							});
						});

						return Promise.all( promises );
					})
					.then( function () {
						var missingError;

						try {
							require( path.resolve( 'es6-module-transpiler-tests/output', t.dir, t.entry ) );
							if ( t.expectedError ) {
								missingError = true;
							}
						} catch( err ) {
							if ( !t.expectedError || !~err.message.indexOf( t.expectedError ) ) {
								throw err;
							}
						}

						if ( missingError ) {
							throw new Error( 'Expected error "' + t.expectedError + '"' );
						}
					}, function ( err ) {
						if ( !t.expectedError || !~err.message.indexOf( t.expectedError ) ) {
							throw err;
						}
					});
				});
			});
		});
	});
};

function makeWhitespaceVisible ( str ) {
	return str.replace( /^\t+/gm, function ( match ) {
		// replace leading tabs
		return match.replace( /\t/g, '--->' );
	}).replace( /^( +)/gm, function ( match, $1 ) {
		// replace leading spaces
		return $1.replace( / /g, '*' );
	}).replace( /\t+$/gm, function ( match ) {
		// replace trailing tabs
		return match.replace( /\t/g, '--->' );
	}).replace( /( +)$/gm, function ( match, $1 ) {
		// replace trailing spaces
		return $1.replace( / /g, '*' );
	});
}
