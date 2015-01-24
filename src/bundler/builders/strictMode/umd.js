import standaloneUmdIntro from 'utils/umd/standaloneUmdIntro';
import strictUmdIntro from 'utils/umd/strictUmdIntro';
import requireName from 'utils/umd/requireName';
import packageResult from 'utils/packageResult';
import { getId, getName } from 'utils/mappers';
import getExportBlock from './utils/getExportBlock';

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

		if ( hasExports && entry.defaultExport ) {
			body.append( '\n\n' + getExportBlock( entry ) );
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
		}, body.getIndentString() );
	}

	body.indent().prepend( intro ).trimLines().append('\n\n}));');

	return packageResult( body, options, 'toUmd', true );
}

function needsDefault ( externalModule ) {
	return externalModule.needsDefault;
}