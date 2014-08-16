var recast = require( 'recast' );

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

	generated += recast.print( parsed.ast ).code;

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
