import packageResult from 'utils/packageResult';
import strictUmdIntro from 'utils/umd/strictUmdIntro';
import reorderImports from 'utils/reorderImports';
import transformBody from './utils/transformBody';
import getImportSummary from './utils/getImportSummary';

export default function umd ( mod, body, options ) {
	var importPaths,
		importNames,
		intro;

	if ( !options.name ) {
		throw new Error( 'You must supply a `name` option for UMD modules' );
	}

	reorderImports( mod.imports );

	[ importPaths, importNames ] = getImportSummary( mod );

	intro = strictUmdIntro({
		hasImports: mod.imports.length > 0,
		hasExports: mod.exports.length > 0,

		importPaths: importPaths,
		importNames: importNames,

		amdName: options.amdName,
		name: options.name
	}, body.indentStr );

	transformBody( mod, body, {
		intro: intro,
		outro: '\n\n}));'
	});

	return packageResult( body, options, 'toUmd' );
}