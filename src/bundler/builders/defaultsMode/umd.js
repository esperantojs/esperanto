import packageResult from 'utils/packageResult';
import defaultUmdIntro from 'utils/umd/defaultUmdIntro';
import { getId } from 'utils/mappers';

export default function umd ( bundle, body, options ) {
	if ( !options || !options.name ) {
		throw new Error( 'You must specify an export name, e.g. `bundle.toUmd({ name: "myModule" })`' );
	}

	var entry = bundle.entryModule;
	var indentStr = body.getIndentString();

	var importPaths = bundle.externalModules.map( getId );
	var importNames = importPaths.map( path => bundle.uniqueNames[ path ] );

	var intro = defaultUmdIntro({
		hasImports: bundle.externalModules.length > 0,
		hasExports: entry.exports.length > 0,

		importPaths: importPaths,
		importNames: importNames,
		args: importNames.map( name => name + '__default' ),

		amdName: options.amdName,
		name: options.name
	}, indentStr );

	body.prepend( intro ).trim();

	var defaultName;
	if ( ( defaultName = entry.identifierReplacements.default ) ) {
		body.append( `\n\n${indentStr}return ${defaultName};` );
	}

	body.append('\n\n}));');

	return packageResult( body, options, 'toUmd', true );
}
