var recast = require( 'recast' );

module.exports = function ( parsed, options ) {

	var generated = '', imports = parsed.imports, exports = parsed.exports;

	generated += imports.map( function ( source, i ) {
		return 'var __imports_' + i + ' = require(\'' + source + '\');'
	}).join( '\n' ) + '\n';

	generated += recast.print( parsed.ast ).code;

	return generated;
};
