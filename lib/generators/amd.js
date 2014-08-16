var recast = require( 'recast' );

module.exports = function ( parsed, options ) {

	var generated = '', imports = parsed.imports, exports = parsed.exports;

	generated += 'define([' + imports.concat( 'exports' ).map( quote ).join( ',' ) + '], function (' + imports.map( getImportName ).concat( 'exports' ).join( ',' ) + ') {\n\n';

	generated += recast.print( parsed.ast ).code;

	generated += '\n\n});';

	return generated;
};


function quote ( str ) {
	return "'" + str + "'";
}

function getImportName ( x, i ) {
	return '__imports_' + i;
}
