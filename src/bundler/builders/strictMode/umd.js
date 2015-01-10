import standaloneUmdIntro from 'utils/umd/standaloneUmdIntro';
import strictUmdIntro from 'utils/umd/strictUmdIntro';
import packageResult from 'utils/packageResult';
import { getId } from 'utils/mappers';
import getExternalDefaults from './utils/getExternalDefaults';
import getExportBlock from './utils/getExportBlock';

export default function umd ( bundle, body, options ) {
	if ( !options || !options.name ) {
		throw new Error( 'You must specify an export name, e.g. `bundle.toUmd({ name: "myModule" })`' );
	}

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
		var importNames = importPaths.map( path => bundle.uniqueNames[ path ] );

		intro = strictUmdIntro({
			hasExports,
			importPaths,
			importNames,
			externalDefaults: getExternalDefaults( bundle ),
			amdName: options.amdName,
			name: options.name,
		}, body.getIndentString() );
	}

	body.indent().prepend( intro ).trimLines().append('\n\n}));');

	return packageResult( body, options, 'toUmd', true );
}
