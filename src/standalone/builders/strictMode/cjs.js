import packageResult from 'utils/packageResult';
import hasOwnProp from 'utils/hasOwnProp';
import transformBody from './utils/transformBody';
import { req } from 'utils/mappers';
import getExportObjectName from 'utils/getExportObjectName';

export default function cjs ( mod, body, options ) {
	var importBlock, seen = {};

	// Create block of require statements
	importBlock = mod.imports.map( x => {
		var name, replacement;

		if ( !hasOwnProp.call( seen, x.path ) ) {
			if ( x.isEmpty ) {
				replacement = `${req(x.path)};`;
			} else {
				name = mod.getName( x );
				replacement = `var ${name} = ${req(x.path)};`;
			}

			seen[ x.path ] = true;
		}

		return replacement;
	}).filter( Boolean ).join( '\n' );

	var exportObject = getExportObjectName(mod);

	transformBody( mod, body, {
		header: importBlock,
		exportObject: exportObject,
	});

	if ( exportObject !== 'exports' ) {
		body.indent();
		body.trimLines();
		body.prepend( `function (${exportObject}) {\n` );
		body.append( '\n}( exports );\n' );
	}

	body.prepend( "'use strict';\n\n" ).trimLines();

	return packageResult( body, options, 'toCjs' );
}
