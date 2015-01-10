import transformExportDeclaration from './utils/transformExportDeclaration';
import packageResult from 'utils/packageResult';
import standaloneUmdIntro from 'utils/umd/standaloneUmdIntro';
import defaultUmdIntro from 'utils/umd/defaultUmdIntro';
import reorderImports from 'utils/reorderImports';

export default function umd ( mod, body, options ) {
	var importNames = [];
	var importPaths = [];

	if ( !options.name ) {
		throw new Error( 'You must supply a `name` option for UMD modules' );
	}

	var hasImports = mod.imports.length > 0;
	var hasExports = mod.exports.length > 0;

	var intro;
	if (!hasImports && !hasExports) {
		intro = standaloneUmdIntro({
			amdName: options.amdName,
		}, body.getIndentString() );
	} else {
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
			hasExports,
			importPaths,
			importNames,
			amdName: options.amdName,
			name: options.name,
			args: importNames,
		}, body.getIndentString() );
	}

	body.indent().prepend( intro ).trimLines().append( '\n\n}));' );

	return packageResult( body, options, 'toUmd' );
}
