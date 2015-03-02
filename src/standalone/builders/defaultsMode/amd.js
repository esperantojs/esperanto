import transformExportDeclaration from './utils/transformExportDeclaration';
import packageResult from 'utils/packageResult';
import hasOwnProp from 'utils/hasOwnProp';
import template from 'utils/template';
import resolveId from 'utils/resolveId';
import { quote } from 'utils/mappers';

var introTemplate = template( 'define(<%= amdName %><%= paths %>function (<%= names %>) {\n\n' );

export default function amd ( mod, options ) {
	var seen = {},
		importNames = [],
		importPaths = [],
		intro,
		placeholders = 0;

	// gather imports, and remove import declarations
	mod.imports.forEach( x => {
		var path = options.absolutePaths ? resolveId( x.path, options.amdName ) : x.path;

		if ( !hasOwnProp.call( seen, path ) ) {
			importPaths.push( path );

			if ( x.as ) {
				while ( placeholders ) {
					importNames.push( '__dep' + importNames.length + '__' );
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

	intro = introTemplate({
		amdName: options.amdName ? `'${options.amdName}', ` : '',
		paths: importPaths.length ? '[' + importPaths.map( quote ).join( ', ' ) + '], ' : '',
		names: importNames.join( ', ' )
	});

	mod.body.trim()
		.prepend( "'use strict';\n\n" )
		.trim()
		.indent()
		.prepend( intro )
		.append( '\n\n});' );

	return packageResult( mod, mod.body, options, 'toAmd' );
}
