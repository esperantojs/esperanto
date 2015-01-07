import template from 'utils/template';
import packageResult from 'utils/packageResult';
import { getId, quote } from 'utils/mappers';
import getExternalDefaults from './utils/getExternalDefaults';
import getExportBlock from './utils/getExportBlock';

var introTemplate = template( 'define(<%= amdName %><%= amdDeps %>function (<%= names %>) {\n\n\t\'use strict\';\n\n' );

export default function amd ( bundle, body, options ) {
	var externalDefaults = getExternalDefaults( bundle );
	var entry = bundle.entryModule;

	var importIds = bundle.externalModules.map( getId );
	var importNames = importIds.map( id => bundle.uniqueNames[ id ] );

	if ( externalDefaults.length ) {
		var defaultsBlock = externalDefaults.map( name => {
			return `var ${name}__default = ('default' in ${name} ? ${name}['default'] : ${name});`;
		}).join( '\n' );

		body.prepend( defaultsBlock + '\n\n' );
	}

	if ( entry.exports.length ) {
		importIds.unshift( 'exports' );
		importNames.unshift( 'exports' );

		if ( entry.defaultExport ) {
			body.append( '\n\n' + getExportBlock( entry ) );
		}
	}

	var intro = introTemplate({
		amdName: options.amdName ? `'${options.amdName}', ` : '',
		amdDeps: importIds.length ? '[' + importIds.map( quote ).join( ', ' ) + '], ' : '',
		names: importNames.join( ', ' )
	}).replace( /\t/g, body.getIndentString() );

	body.indent().prepend( intro ).append( '\n\n});' );
	return packageResult( body, options, 'toAmd', true );
}
