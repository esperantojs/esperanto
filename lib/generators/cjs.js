module.exports = function ( parsed, options ) {

	var generated = '', imports = parsed.imports, exports = parsed.exports;

	generated += imports.map( function ( source, i ) {
		return 'var __imports_' + i + ' = require(\'' + source + '\');';
	}).join( '\n' ) + '\n';

	if ( options.defaultOnly && !parsed.alreadyReturned && parsed.exports.length ) {
		generated += 'var __export;\n\n';
	}

	generated += parsed.body;

	if ( options.defaultOnly && !parsed.alreadyReturned && parsed.exports.length ) {
		generated += '\nmodule.exports = __export;';
	}

	return generated.trim();
};
