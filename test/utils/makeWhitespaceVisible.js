module.exports = function makeWhitespaceVisible ( str ) {
	return str.replace( /\r?\n/g, '¶\n' ).replace( /^\t+/gm, function ( match ) {
		// replace leading tabs
		return match.replace( /\t/g, '--->' );
	}).replace( /^( +)/gm, function ( match, $1 ) {
		// replace leading spaces
		return $1.replace( / /g, '*' );
	}).replace( /\t+$/gm, function ( match ) {
		// replace trailing tabs
		return match.replace( /\t/g, '--->' );
	}).replace( /( +)$/gm, function ( match, $1 ) {
		// replace trailing spaces
		return $1.replace( / /g, '*' );
	});
};
