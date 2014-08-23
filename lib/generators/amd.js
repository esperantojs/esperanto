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
			( options.defaultOnly || !hasExports ?
				imports.map( getPath ) :
				[ 'exports' ].concat( imports.map( getPath ) )
			).map( quote ).join( ',' ) +
		'],';

		// Remove empty imports from the end of the array
		while ( imports.length && imports[ imports.length - 1 ].empty ) {
			imports.pop();
		}

		importNames = (
			options.defaultOnly || !hasExports ?
				imports.map( getImportName ) :
				[ 'exports' ].concat( imports.map( getImportName ) )
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