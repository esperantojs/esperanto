import packageResult from 'utils/packageResult';
import standaloneUmdIntro from 'utils/umd/standaloneUmdIntro';
import defaultUmdIntro from 'utils/umd/defaultUmdIntro';
import requireName from 'utils/umd/requireName';
import { getId, getName } from 'utils/mappers';

export default function umd ( bundle, body, options ) {
	requireName( options );

	var entry = bundle.entryModule;

	var hasImports = bundle.externalModules.length > 0;
	var hasExports = entry.exports.length > 0;

	var intro;
	if (!hasImports && !hasExports) {
		intro = standaloneUmdIntro({
			amdName: options.amdName,
		}, body.getIndentString() );
	} else {

		var defaultName = entry.identifierReplacements.default;
		if ( defaultName ) {
			body.append( `\n\nreturn ${defaultName};` );
		}

		var importPaths = bundle.externalModules.map( getId );
		var importNames = bundle.externalModules.map( getName );

		intro = defaultUmdIntro({
			hasExports,
			importPaths,
			importNames,
			amdName: options.amdName,
			name: options.name
		}, body.getIndentString() );
	}

	body.indent().prepend( intro ).trimLines().append('\n\n}));');

	return packageResult( body, options, 'toUmd', true );
}
