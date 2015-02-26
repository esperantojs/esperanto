import packageResult from 'utils/packageResult';
import standaloneUmdIntro from 'utils/umd/standaloneUmdIntro';
import strictUmdIntro from 'utils/umd/strictUmdIntro';
import transformBody from './utils/transformBody';
import getImportSummary from './utils/getImportSummary';

export default function umd ( mod, body, options ) {
	var [ importPaths, importNames ] = getImportSummary( mod );

	var hasImports = mod.imports.length > 0;
	var hasExports = mod.exports.length > 0;

	var intro;
	if (!hasImports && !hasExports) {
		intro = standaloneUmdIntro({
			amdName: options.amdName,
		}, body.getIndentString() );
	} else {
		intro = strictUmdIntro({
			hasExports,
			importPaths,
			importNames,
			amdName: options.amdName,
			absolutePaths: options.absolutePaths,
			name: options.name
		}, body.getIndentString() );
	}

	transformBody( mod, body, {
		intro: intro,
		outro: '\n\n}));',
		_evilES3SafeReExports: options._evilES3SafeReExports
	});

	return packageResult( body, options, 'toUmd' );
}
