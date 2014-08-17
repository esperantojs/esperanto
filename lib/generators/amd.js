module.exports = function ( parsed, options ) {

	var generated = '', imports = parsed.imports, exports = parsed.exports;

	generated += 'define([' +
		( options.defaultOnly ? imports : imports.concat( 'exports' ) ).map( quote ).join( ',' ) +
	'], function (' +
		( options.defaultOnly ? imports.map( getImportName ) : imports.map( getImportName ).concat( 'exports' ) ).join( ',' ) +
	') {\n\n';

	if ( options.defaultOnly ) {
		generated += 'var __export;\n\n';
	}

	indent = options.indent || guessIndent( parsed.body );
	generated += applyIndent( parsed.body, indent );

	if ( options.defaultOnly ) {
		generated += '\nreturn __export;';
	}

	generated += '\n\n});';

	return generated.trim();
};


function quote ( str ) {
	return "'" + str + "'";
}

function getImportName ( x, i ) {
	return '__imports_' + i;
}

function guessIndent ( code ) {
	var lines, tabbed, spaced;

	lines = code.split( '\n' );

	tabbed = lines.filter( function ( line ) {
		return /^\t+/.test( line );
	});

	spaced = lines.filter( function ( line ) {
		return /^ +/.test( line );
	});

	// More lines tabbed than spaced? Assume tabs, and
	// default to tabs in the case of a tie (or nothing
	// to go on)
	if ( tabbed.length >= spaced.length ) {
		return '\t';
	}

	// Otherwise, we need to guess the multiple
	min = spaced.reduce( function ( previous, current ) {
		var numSpaces = /^ +/.exec( current )[0].length;
		return Math.min( numSpaces, previous );
	}, Infinity );

	return new Array( min + 1 ).join( ' ' );
}

function applyIndent ( code, indent ) {
	return code.split( '\n' ).map( function ( line ) {
		return indent + line;
	}).join( '\n' );
}
