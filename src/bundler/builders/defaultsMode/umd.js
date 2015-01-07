import packageResult from 'utils/packageResult';
import defaultUmdIntro from 'utils/umd/defaultUmdIntro';
import { getId } from 'utils/mappers';

export default function umd ( bundle, body, options ) {
	if ( !options || !options.name ) {
		throw new Error( 'You must specify an export name, e.g. `bundle.toUmd({ name: "myModule" })`' );
	}

	var entry = bundle.entryModule;

	var importPaths = bundle.externalModules.map( getId );
	var importNames = importPaths.map( path => bundle.uniqueNames[ path ] );

	var defaultName = entry.identifierReplacements.default;
	if ( defaultName ) {
		body.append( `\n\nreturn ${defaultName};` );
	}

	var intro = defaultUmdIntro({
		hasImports: bundle.externalModules.length > 0,
		hasExports: entry.exports.length > 0,

		importPaths: importPaths,
		importNames: importNames,
		args: importNames.map( name => name + '__default' ),

		amdName: options.amdName,
		name: options.name
	}, body.getIndentString() );

	body.indent().prepend( intro ).append('\n\n}));');

	return packageResult( body, options, 'toUmd', true );
}
