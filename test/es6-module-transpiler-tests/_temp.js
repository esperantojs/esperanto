var sander = require( 'sander' );

[
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
	{ entry: 'mod', dir: 'this-binding-get-early-error', expectedError: '`this` at the top level is undefined' },
	{ entry: 'mod', dir: 'this-binding-set-early-error', expectedError: '`this` at the top level is undefined' },
	{ entry: 'importer', dir: 'update-expression-of-import-fails', expectedError: 'Cannot reassign imported binding `a`' }
].forEach( function ( test ) {
	var pairs, config;

	pairs = [{ key: 'entry', value: test.entry }];

	if ( test.expectedError ) {
		pairs.push({ key: 'expectedError', value: test.expectedError });
	}

	config = 'module.exports = {\n\t' +
		pairs.map( function ( pair ) {
			return pair.key + ": '" + pair.value + "'";
		}).join( ',\t' ) + '\n};';

	console.log( 'config', config );

	sander.writeFile( __dirname, 'input', test.dir, '_config.js', config ).catch( function ( err ) {
		console.log( 'err', err );
	});
});