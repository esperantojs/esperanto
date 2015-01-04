import transformExportDeclaration from './utils/transformExportDeclaration';
import packageResult from '../../../utils/packageResult';
import reorderImports from 'utils/reorderImports';
import template from 'utils/template';
import { quote } from 'utils/mappers';

var introTemplate = template( 'define(<%= paths %>function (<%= names %>) {\n\n' );

export default function amd ( mod, body, options ) {
	var importNames = [],
		importPaths = [],
		intro,
		i;

	// ensure empty imports are at the end
	reorderImports( mod.imports );

	// gather imports, and remove import declarations
	mod.imports.forEach( ( x, i ) => {
		var specifier;

		importPaths[i] = x.path;

		specifier = x.specifiers[0];
		if ( specifier ) {
			importNames[i] = specifier.batch ? specifier.name : specifier.as;
		}

		body.remove( x.start, x.next );
	});

	transformExportDeclaration( mod.exports[0], body );

	intro = introTemplate({
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
