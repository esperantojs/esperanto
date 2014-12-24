import transformExportDeclaration from './utils/transformExportDeclaration';
import packageResult from '../../../utils/packageResult';
import reorderImports from 'utils/reorderImports';
import template from 'utils/template';
import { quote } from 'utils/mappers';

var introTemplate = template( 'define(<%= IMPORT_PATHS %>function (<%= IMPORT_NAMES %>) {\n\n' );

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

	body.trim();

	body.prepend( "'use strict';\n\n" ).trim();

	intro = introTemplate({
		IMPORT_PATHS: importPaths.length ? '[' + importPaths.map( quote ).join( ', ' ) + '], ' : '',
		IMPORT_NAMES: importNames.join( ', ' )
	});

	body.indent().prepend( intro ).append( '\n\n});' );

	return packageResult( body, options, 'toAmd' );
}
