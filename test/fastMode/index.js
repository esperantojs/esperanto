var assert = require( 'assert' ),
	sander = require( 'sander' ),
	makeWhitespaceVisible = require( '../utils/makeWhitespaceVisible' ),
	esperanto;

module.exports = function () {
	describe( 'fast mode', function () {
		var tests;

		tests = [
			{ file: 'earlyExport', description: 'transpiles exports that are not the final statement' },
			{ file: 'emptyImport', description: 'transpiles empty imports with no exports' },
			{ file: 'emptyImportWithDefaultExport', description: 'transpiles empty imports with default exports' },
			{ file: 'exportAnonFunction', description: 'transpiled anonymous default function exports' },
			{ file: 'exportDefault', description: 'transpiles default exports' },
			{ file: 'exportFunction', description: 'transpiles named default function exports' },
			{ file: 'importAll', description: 'transpiles `import * as foo from "foo"`' },
			{ file: 'importDefault', description: 'transpiles default imports' },
			{ file: 'multipleImports', description: 'transpiles multiple imports' },
			{ file: 'trailingEmptyImport', description: 'transpiles trailing empty imports' },
			{ file: 'banner', description: 'adds a banner', banner: '/* this is a banner */\n' },
			{ file: 'footer', description: 'adds a footer', footer: '\n/* this is a footer */' },
			{ file: 'bannerAndFooter', description: 'adds a banner and a footer', banner: '/* this is a banner */\n', footer: '\n/* this is a footer */' }
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
						name: t.name || 'myModule',
						banner: t.banner,
						footer: t.footer
					});

					return sander.readFile( 'fastMode/output/' + dir, t.file ).then( String ).then( function ( expected ) {
						assert.equal( actual.code, expected, 'Expected\n>\n' + makeWhitespaceVisible( actual.code ) + '\n>\n\nto match\n\n>\n' + makeWhitespaceVisible( expected ) + '\n>' );
					}).catch( function ( err ) {
						if ( err.code === 'ENOENT' ) {
							assert.equal( actual.code, '', 'Expected\n>\n' + makeWhitespaceVisible( actual.code ) + '\n>\n\nto match non-existent file' );
						} else {
							throw err;
						}
					});
				});
			});
		}
	});
};
