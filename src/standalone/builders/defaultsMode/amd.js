import transformExportDeclaration from './utils/transformExportDeclaration';
import packageResult from 'utils/packageResult';
import hasOwnProp from 'utils/hasOwnProp';
import template from 'utils/template';
import { quote } from 'utils/mappers';

var introTemplate = template( 'define(<%= amdName %><%= paths %>function (<%= names %>) {\n\n' );

export default function amd ( mod, body, options ) {
	var seen = {},
		importNames = [],
		importPaths = [],
		intro;

	// gather imports, and remove import declarations
	mod.imports.forEach( x => {
		if ( !hasOwnProp.call( seen, x.path ) ) {
			importPaths.push( x.path );

			if ( x.name ) {
				importNames.push( x.name );
			}

			seen[ x.path ] = true;
		}

		body.remove( x.start, x.next );
	});

	transformExportDeclaration( mod.exports[0], body );

	intro = introTemplate({
		amdName: options.amdName ? `'${options.amdName}', ` : '',
		paths: importPaths.length ? '[' + importPaths.map( quote ).join( ', ' ) + '], ' : '',
		names: importNames.join( ', ' )
	});

	body.trim()
		.prepend( "'use strict';\n\n" )
		.trim()
		.indent()
		.prepend( intro )
		.append( '\n\n});' );

	return packageResult( body, options, 'toAmd' );
}
