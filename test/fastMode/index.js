var assert = require( 'assert' ),
	sander = require( 'sander' ),
	esperanto;

module.exports = function () {
	describe( 'fast mode', function () {
		var tests;

		tests = [
			{ file: 'exportDefault', description: 'transpiles default exports' },
			{ file: 'earlyExport', description: 'transpiles exports that are not the final statement' },
			{ file: 'emptyImport', description: 'transpiles empty imports with no exports' },
			{ file: 'emptyImportWithDefaultExport', description: 'transpiles empty imports with default exports' },
			{ file: 'importAll', description: 'transpiles `import * as foo from "foo"`' },
			{ file: 'importDefault', description: 'transpiles default imports' },
			{ file: 'multipleImports', description: 'transpiles multiple imports' },
			{ file: 'trailingEmptyImport', description: 'transpiles trailing empty imports' }
		];

		tests.forEach( function ( t ) {
			t.file += '.js';
			t.source = sander.readFileSync( 'samples', t.file ).toString();
		});

		before( function () {
			return require( '../utils/build' )().then( function ( lib ) {
				esperanto = lib;
			});
		});

		describe( 'esperanto.toAmd()', function () {
			tests.forEach( function ( t ) {
				it( t.description, function () {
					return sander.readFile( 'fastMode/output/amd', t.file ).then( String ).then( function ( expected ) {
						var actual = esperanto.toAmd( t.source );
						assert.equal( actual, expected, 'AMD: Expected\n>\n' + actual + '\n>\n\nto match\n\n>\n' + expected + '\n>' );
					});
				});
			});
		});

		describe( 'esperanto.toCjs()', function () {
			tests.forEach( function ( t ) {
				it( t.description, function () {
					return sander.readFile( 'fastMode/output/cjs', t.file ).then( String ).then( function ( expected ) {
						var actual = esperanto.toCjs( t.source );
						assert.equal( actual, expected, 'CJS: Expected\n>\n' + actual + '\n>\n\nto match\n\n>\n' + expected + '\n>' );
					});
				});
			});
		});

		describe( 'esperanto.toUmd()', function () {
			tests.forEach( function ( t ) {
				it( t.description, function () {
					return sander.readFile( 'fastMode/output/umd', t.file ).then( String ).then( function ( expected ) {
						var actual = esperanto.toUmd( t.source, {
							name: 'myModule'
						});

						assert.equal( actual, expected, 'UMD: Expected\n>\n' + actual + '\n>\n\nto match\n\n>\n' + expected + '\n>' );
					});
				});
			});
		});
	});
};
