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

	var importPaths = bundle.externalModules.map( getId );
	var importNames = importPaths.map( path => bundle.uniqueNames[ path ] );

	var intro = strictUmdIntro({
		hasImports: bundle.externalModules.length > 0,
		hasExports: entry.exports.length > 0,

		importPaths: importPaths,
		importNames: importNames,
		externalDefaults: getExternalDefaults( bundle ),

		amdName: options.amdName,
		name: options.name
	}, body.getIndentString() );

	if ( entry.exports.length && entry.defaultExport ) {
		body.append( '\n\n' + getExportBlock( entry ) );
	}

	body.indent().prepend( intro ).append('\n\n}));');

	return packageResult( body, options, 'toUmd', true );
}
