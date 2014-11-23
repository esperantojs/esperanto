import transformExportDeclaration from './utils/transformExportDeclaration';
import packageResult from '../../../utils/packageResult';

var template = 'define(__IMPORT_PATHS__function (__IMPORT_NAMES__) {\n\n';

export default function amd ( mod, body, options ) {
	var importNames = [],
		importPaths = [],
		intro,
		i;

	// ensure empty imports are at the end
	i = mod.imports.length;
	while ( i-- ) {
		if ( !mod.imports[i].specifiers.length ) {
			mod.imports.splice( mod.imports.length - 1, 0, mod.imports.splice( i, 1 )[0] );
		}
	}

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

	intro = template
		.replace( '__IMPORT_PATHS__', importPaths.length ? '[' + importPaths.map( quote ).join( ', ' ) + '], ' : '' )
		.replace( '__IMPORT_NAMES__', importNames.join( ', ' ) );

	body.indent().prepend( intro ).append( '\n\n});' );

	return packageResult( body, options, 'toAmd' );
}

function quote ( str ) {
	return "'" + str + "'";
}
