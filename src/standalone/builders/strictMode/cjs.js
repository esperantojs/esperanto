import packageResult from 'utils/packageResult';
import hasOwnProp from 'utils/hasOwnProp';
import transformBody from './utils/transformBody';
import { req } from 'utils/mappers';

export default function cjs ( mod, body, options ) {
	var importBlock, seen = {};

	// Create block of require statements
	importBlock = mod.imports.map( x => {
		var name, replacement;

		if ( !hasOwnProp.call( seen, x.path ) ) {
			if ( x.isEmpty ) {
				replacement = `${req(x.path)};`;
			} else {
				replacement = `var ${x.name} = ${req(x.path)};`;
			}

			seen[ x.path ] = true;
		}

		return replacement;
	}).filter( Boolean ).join( '\n' );

	transformBody( mod, body, {
		header: importBlock,
		_evilES3SafeReExports: options._evilES3SafeReExports
	});

	body.prepend( "'use strict';\n\n" ).trimLines();

	return packageResult( body, options, 'toCjs' );
}
