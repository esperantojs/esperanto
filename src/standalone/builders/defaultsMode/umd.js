import transformExportDeclaration from './utils/transformExportDeclaration';
import packageResult from 'utils/packageResult';
import defaultUmdIntro from 'utils/umd/defaultUmdIntro';
import reorderImports from 'utils/reorderImports';

export default function umd ( mod, body, options ) {
	var importNames = [],
		importPaths = [],
		intro,
		i;

	if ( !options.name ) {
		throw new Error( 'You must supply a `name` option for UMD modules' );
	}

	// ensure empty imports are at the end
	reorderImports( mod.imports );

	// gather imports, and remove import declarations
	mod.imports.forEach( ( x, i ) => {
		importPaths[i] = x.path;

		if ( x.name ) {
			importNames[i] = x.name;
		}

		body.remove( x.start, x.next );
	});

	transformExportDeclaration( mod.exports[0], body );

	intro = defaultUmdIntro({
		hasImports: mod.imports.length > 0,
		hasExports: mod.exports.length > 0,

		importPaths: importPaths,
		importNames: importNames,

		amdName: options.amdName,
		name: options.name
	}, mod.body.indentStr );

	body.trim()
		.prepend( "'use strict';\n\n" )
		.trim()
		.indent()
		.prepend( intro )
		.append( '\n\n}));' );

	return packageResult( body, options, 'toUmd' );
}
