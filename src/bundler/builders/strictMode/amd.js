import template from 'utils/template';
import packageResult from 'utils/packageResult';
import { getId, quote } from 'utils/mappers';
import getExportBlock from './utils/getExportBlock';

var introTemplate;

export default function amd ( bundle, body, options ) {
	var defaultsBlock,
		entry = bundle.entryModule,
		importIds = bundle.externalModules.map( getId ),
		importNames = importIds.map( id => bundle.uniqueNames[ id ] ),
		intro,
		indentStr;

	indentStr = body.getIndentString();

	if ( importNames.length ) {
		defaultsBlock = importNames.map( name => {
			return indentStr + `var ${name}__default = ('default' in ${name} ? ${name}['default'] : ${name});`;
		}).join( '\n' );

		body.prepend( defaultsBlock + '\n\n' );
	}

	if ( entry.exports.length ) {
		importIds.unshift( 'exports' );
		importNames.unshift( 'exports' );

		if ( entry.defaultExport ) {
			body.append( '\n\n' + getExportBlock( bundle, entry, indentStr ) );
		}
	}

	intro = introTemplate({
		amdDeps: importIds.length ? '[' + importIds.map( quote ).join( ', ' ) + '], ' : '',
		names: importNames.join( ', ' )
	}).replace( /\t/g, indentStr );

	body.prepend( intro ).trim().append( '\n\n});' );
	return packageResult( body, options, 'toAmd', true );
}

introTemplate = template( 'define(<%= amdDeps %>function (<%= names %>) {\n\n\t\'use strict\';\n\n' );
