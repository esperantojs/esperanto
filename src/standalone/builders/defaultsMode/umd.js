import transformExportDeclaration from './utils/transformExportDeclaration';
import packageResult from 'utils/packageResult';
import hasOwnProp from 'utils/hasOwnProp';
import standaloneUmdIntro from 'utils/umd/standaloneUmdIntro';
import defaultUmdIntro from 'utils/umd/defaultUmdIntro';
import requireName from 'utils/umd/requireName';

export default function umd ( mod, body, options ) {
	var importNames = [];
	var importPaths = [];
	var seen = {};
	var placeholders = 0;

	requireName( options );

	var hasImports = mod.imports.length > 0;
	var hasExports = mod.exports.length > 0;

	var intro;
	if (!hasImports && !hasExports) {
		intro = standaloneUmdIntro({
			amdName: options.amdName,
		}, body.getIndentString() );
	} else {
		// gather imports, and remove import declarations
		mod.imports.forEach( x => {
			if ( !hasOwnProp.call( seen, x.path ) ) {
				importPaths.push( x.path );

				if ( x.as ) {
					while ( placeholders ) {
						importNames.push( '__dep' + importNames.length + '__' );
						placeholders--;
					}
					importNames.push( x.as );
				} else {
					placeholders++;
				}

				seen[ x.path ] = true;
			}

			body.remove( x.start, x.next );
		});

		transformExportDeclaration( mod.exports[0], body );

		intro = defaultUmdIntro({
			hasExports,
			importPaths,
			importNames,
			amdName: options.amdName,
			absolutePaths: options.absolutePaths,
			name: options.name
		}, body.getIndentString() );
	}

	body.indent().prepend( intro ).trimLines().append( '\n\n}));' );

	return packageResult( body, options, 'toUmd' );
}
