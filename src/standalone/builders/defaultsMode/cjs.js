import hasOwnProp from 'utils/hasOwnProp';
import packageResult from 'utils/packageResult';
import { req } from 'utils/mappers';

export default function cjs ( mod, options ) {
	var seen = {}, exportDeclaration;

	mod.imports.forEach( x => {
		if ( !hasOwnProp.call( seen, x.path ) ) {
			var replacement = x.isEmpty ? `${req(x.path)};` : `var ${x.as} = ${req(x.path)};`;
			mod.body.replace( x.start, x.end, replacement );

			seen[ x.path ] = true;
		} else {
			mod.body.remove( x.start, x.next );
		}
	});

	exportDeclaration = mod.exports[0];

	if ( exportDeclaration ) {
		switch ( exportDeclaration.type ) {
			case 'namedFunction':
			case 'namedClass':
				mod.body.remove( exportDeclaration.start, exportDeclaration.node.declaration.start );
				mod.body.replace( exportDeclaration.end, exportDeclaration.end, `\nmodule.exports = ${exportDeclaration.node.declaration.id.name};` );
				break;

			default:
				mod.body.replace( exportDeclaration.start, exportDeclaration.node.declaration.start, 'module.exports = ' );
				break;
		}
	}

	mod.body.prepend( "'use strict';\n\n" ).trimLines();

	return packageResult( mod, mod.body, options, 'toCjs' );
}
