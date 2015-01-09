import packageResult from 'utils/packageResult';
import transformBody from './utils/transformBody';

export default function cjs ( mod, body, options ) {
	var importBlock;

	// Create block of require statements
	importBlock = mod.imports.map( x => {
		var name, replacement;

		if ( x.isEmpty ) {
			replacement = `require('${x.path}');`;
		} else {
			name = mod.getName( x );
			replacement = `var ${name} = require('${x.path}');`;
		}

		return replacement;
	}).join( '\n' );

	transformBody( mod, body, {
		header: importBlock,
	});

	body.prepend( "'use strict';\n\n" ).trimLines()

	return packageResult( body, options, 'toCjs' );
}
