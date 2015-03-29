import standaloneUmdIntro from 'utils/umd/standaloneUmdIntro';
import strictUmdIntro from 'utils/umd/strictUmdIntro';
import requireName from 'utils/umd/requireName';
import packageResult from 'utils/packageResult';
import { getId, getName } from 'utils/mappers';
import getExportBlock from './utils/getExportBlock';

export default function umd ( bundle, options ) {
	requireName( options );

	let entry = bundle.entryModule;

	let hasImports = bundle.externalModules.length > 0;
	let hasExports = entry.exports.length > 0;

	let intro;
	if ( !hasImports && !hasExports ) {
		intro = standaloneUmdIntro({
			amdName: options.amdName,
		}, bundle.body.getIndentString() );
	} else {

		if ( hasExports && entry.defaultExport ) {
			bundle.body.append( '\n\n' + getExportBlock( entry ) );
		}

		var importPaths = bundle.externalModules.map( getId );
		var importNames = bundle.externalModules.map( getName );

		intro = strictUmdIntro({
			hasExports,
			importPaths,
			importNames,
			externalDefaults: bundle.externalModules.filter( needsDefault ),
			amdName: options.amdName,
			name: options.name,
		}, bundle.body.getIndentString() );
	}

	bundle.body.indent().prepend( intro ).trimLines().append('\n\n}));');

	return packageResult( bundle, bundle.body, options, 'toUmd', true );
}

function needsDefault ( externalModule ) {
	return externalModule.needsDefault;
}
