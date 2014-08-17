module.exports = function ( parsed, options ) {

	var result = [],
		code = parsed.body.trim(),
		imports = parsed.imports,
		exports = parsed.exports;

	if ( imports.length ) {
		result[0] = imports.map( function ( x ) {
			return 'var ' + x.name + ' = require(\'' + x.path + '\');';
		}).join( '\n' );
	}

	if ( options.defaultOnly && !parsed.alreadyReturned && exports.length ) {
		code = 'var __export;\n\n' + code;
	}

	result.push( code );

	if ( options.defaultOnly && !parsed.alreadyReturned && exports.length ) {
		result.push( 'module.exports = __export;' );
	}

	return result.join( '\n' );
};
