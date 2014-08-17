module.exports = function applyIndent ( code, indent ) {
	return code.split( '\n' ).map( function ( line ) {
		return indent + line;
	}).join( '\n' );
};