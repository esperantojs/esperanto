import transformExportDeclaration from './utils/transformExportDeclaration';
import packageResult from 'utils/packageResult';
import hasOwnProp from 'utils/hasOwnProp';
import resolveId from 'utils/resolveId';
import { quote } from 'utils/mappers';

export default function amd ( mod, options ) {
	let seen = {};
	let importNames = [];
	let importPaths = [];
	let placeholders = 0;

	// gather imports, and remove import declarations
	mod.imports.forEach( x => {
		let path = options.absolutePaths ? resolveId( x.path, options.amdName ) : x.path;

		if ( !hasOwnProp.call( seen, path ) ) {
			importPaths.push( path );

			if ( x.as ) {
				while ( placeholders ) {
					importNames.push( `__dep${importNames.length}__` );
					placeholders--;
				}
				importNames.push( x.as );
			} else {
				placeholders++;
			}

			seen[ path ] = true;
		}

		mod.body.remove( x.start, x.next );
	});

	transformExportDeclaration( mod.exports[0], mod.body );

	let amdName = options.amdName ? `'${options.amdName}', ` : '';
	let paths = importPaths.length ? '[' + importPaths.map( quote ).join( ', ' ) + '], ' : '';
	let names = importNames.join( ', ' );

	let intro = `define(${amdName}${paths}function (${names}) {

`;

	mod.body.trim()
		.prepend( "'use strict';\n\n" )
		.trim()
		.indent()
		.prepend( intro )
		.append( '\n\n});' );

	return packageResult( mod, mod.body, options, 'toAmd' );
}
