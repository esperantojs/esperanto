import template from '../../../utils/template';
import packageResult from '../../../utils/packageResult';
import getExportName from './utils/getExportName';

var introTemplate = template( 'define(<%= amdDeps %>function (<%= names %>) {\n\n\t\'use strict\';\n\n' );

export default function amd ( bundle, body, options ) {
	var intro,
		indentStr;

	indentStr = body.getIndentString();

	if ( bundle.entryModule.defaultExport ) {
		body.append( `\n\n${indentStr}return ${getExportName(bundle)};` );
	}

	intro = introTemplate({
		amdDeps: bundle.externalModules.length ? '[' + bundle.externalModules.map( quoteId ).join( ', ' ) + '], ' : '',
		names: bundle.externalModules.map( m => bundle.uniqueNames[ m.id ] + '__default' ).join( ', ' )
	}).replace( /\t/g, indentStr );

	body.prepend( intro ).trim().append( '\n\n});' );
	return packageResult( body, options, 'toAmd', true );
}

function quoteId ( m ) {
	return "'" + m.id + "'";
}
