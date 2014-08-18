module.exports = function ( parsed, options ) {

	var result = [],
		code = parsed.body.trim(),
		imports = parsed.imports,
		hasExports = parsed.hasExports;

	if ( imports.length ) {
		result[0] = imports.map( function ( x ) {
			return ( !x.empty ? 'var ' + x.name + ' = ' : '' ) + 'require(\'' + x.path + '\');';
		}).join( '\n' ) + '\n';
	}

	if ( options.defaultOnly && !parsed.alreadyReturned && hasExports ) {
		code = 'var __export;\n\n' + code;
	}

	result.push( code );

	if ( options.defaultOnly && !parsed.alreadyReturned && hasExports ) {
		result.push( 'module.exports = __export;' );
	}

	return result.join( '\n' ).trim();
};