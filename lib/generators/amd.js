var __export;

__export = function amd ( parsed, options ) {

	var guessIndent = require( '../utils/guessIndent' ),
		applyIndent = require( '../utils/applyIndent' ),
		intro,
		outro,
		code = '',
		imports = parsed.imports,
		hasExports = parsed.hasExports,
		importPaths = '',
		importNames = '',
		indent;

	if ( imports.length || hasExports && !options.defaultOnly ) {
		importPaths = '[' +
			( options.defaultOnly ?
				imports.map( getPath ) :
				imports.map( getPath ).concat( 'exports' )
			).map( quote ).join( ',' ) +
		'],';

		importNames = (
			options.defaultOnly ?
				imports.map( getImportName ) :
				imports.map( getImportName ).concat( 'exports' )
		).join( ', ' );
	}

	intro = 'define(' + importPaths + 'function (' + importNames + ') {';

	if ( options.addUseStrict !== false ) {
		code = "'use" + " strict';\n\n";
	}

	if ( options.defaultOnly && !parsed.alreadyReturned && hasExports ) {
		code += 'var __export;\n\n';
	}

	code += parsed.body;

	if ( options.defaultOnly && !parsed.alreadyReturned && hasExports ) {
		code += '\nreturn __export;';
	}

	outro = '});';

	indent = options.indent || guessIndent( parsed.body );
	return [ intro, applyIndent( code.trim(), indent ), outro ].join( '\n\n' );
};

function quote ( str ) {
	return "'" + str + "'";
}

function getPath ( x ) {
	return x.path;
}

function getImportName ( x ) {
	return x.name;
}
module.exports = __export;