import packageResult from 'utils/packageResult';
import transformBody from './utils/transformBody';
import { req } from 'utils/mappers';

export default function cjs ( mod, body, options ) {
	var importBlock;

	// Create block of require statements
	importBlock = mod.imports.map( x => {
		var name, replacement;

		if ( x.isEmpty ) {
			replacement = `${req(x.path)};`;
		} else {
			name = mod.getName( x );
			replacement = `var ${name} = ${req(x.path)};`;
		}

		return replacement;
	}).join( '\n' );

	transformBody( mod, body, {
		header: importBlock,
	});

	body.prepend( "'use strict';\n\n" ).trimLines()

	return packageResult( body, options, 'toCjs' );
}
