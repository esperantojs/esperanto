import packageResult from 'utils/packageResult';
import { req } from 'utils/mappers';

export default function cjs ( mod, body, options ) {
	var exportDeclaration;

	mod.imports.forEach( x => {
		var replacement = x.isEmpty ? `${req(x.path)};` : `var ${x.name} = ${req(x.path)};`;
		body.replace( x.start, x.end, replacement );
	});

	exportDeclaration = mod.exports[0];

	if ( exportDeclaration ) {
		switch ( exportDeclaration.type ) {
			case 'namedFunction':
			case 'namedClass':
				body.remove( exportDeclaration.start, exportDeclaration.valueStart );
				body.replace( exportDeclaration.end, exportDeclaration.end, `\nmodule.exports = ${exportDeclaration.node.declaration.id.name};` );
				break;

			case 'anonFunction':
			case 'anonClass':
			case 'expression':
				body.replace( exportDeclaration.start, exportDeclaration.valueStart, 'module.exports = ' );
				break;

			default:
				throw new Error( 'Unexpected export type' );
		}
	}

	body.prepend( "'use strict';\n\n" ).trimLines()

	return packageResult( body, options, 'toCjs' );
}
