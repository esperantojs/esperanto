import packageResult from 'utils/packageResult';
import standaloneUmdIntro from 'utils/umd/standaloneUmdIntro';
import defaultUmdIntro from 'utils/umd/defaultUmdIntro';
import requireName from 'utils/umd/requireName';
import { getId, getName } from 'utils/mappers';

export default function umd ( bundle, options ) {
	requireName( options );

	let entry = bundle.entryModule;

	let hasImports = bundle.externalModules.length > 0;
	let hasExports = entry.exports.length > 0;

	let intro;
	if (!hasImports && !hasExports) {
		intro = standaloneUmdIntro({
			amdName: options.amdName,
		}, bundle.body.getIndentString() );
	} else {

		let defaultName = entry.identifierReplacements.default;
		if ( defaultName ) {
			bundle.body.append( `\n\nreturn ${defaultName};` );
		}

		let importPaths = bundle.externalModules.map( getId );
		let importNames = bundle.externalModules.map( getName );

		intro = defaultUmdIntro({
			hasExports,
			importPaths,
			importNames,
			amdName: options.amdName,
			name: options.name
		}, bundle.body.getIndentString() );
	}

	bundle.body.indent().prepend( intro ).trimLines().append('\n\n}));');

	return packageResult( bundle, bundle.body, options, 'toUmd', true );
}
