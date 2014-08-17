module.exports = function ( parsed, options ) {

	var guessIndent = require( '../utils/guessIndent' ),
		applyIndent = require( '../utils/applyIndent' ),
		intro,
		outro,
		code,
		imports = parsed.imports,
		exports = parsed.exports,
		importPaths = '',
		importNames = '',
		indent;

	if ( imports.length ) {
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

	code = '';

	if ( options.defaultOnly && !parsed.alreadyReturned && exports.length ) {
		code += 'var __export;\n\n';
	}

	code += parsed.body;

	if ( options.defaultOnly && !parsed.alreadyReturned && exports.length ) {
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
