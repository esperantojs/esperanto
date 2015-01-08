import packageResult from 'utils/packageResult';
import standaloneUmdIntro from 'utils/umd/standaloneUmdIntro';
import defaultUmdIntro from 'utils/umd/defaultUmdIntro';
import { getId } from 'utils/mappers';

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

		var defaultName = entry.identifierReplacements.default;
		if ( defaultName ) {
			body.append( `\n\nreturn ${defaultName};` );
		}

		var importPaths = bundle.externalModules.map( getId );
		var importNames = importPaths.map( path => bundle.uniqueNames[ path ] );

		intro = defaultUmdIntro({
			hasExports,
			importPaths,
			importNames,
			amdName: options.amdName,
			name: options.name,
			args: importNames.map( name => name + '__default' ),
		}, body.getIndentString() );
	}

	body.indent().prepend( intro ).trimLines().append('\n\n}));');

	return packageResult( body, options, 'toUmd', true );
}
