import template from '../../../utils/template';
import packageResult from '../../../utils/packageResult';

var introTemplate = template( 'define(<%= amdName %><%= amdDeps %>function (<%= names %>) {\n\n\t\'use strict\';\n\n' );

export default function amd ( bundle, body, options ) {
	var intro,
		indentStr,
		defaultName;

	indentStr = body.getIndentString();

	if ( defaultName = bundle.entryModule.identifierReplacements.default ) {
		body.append( `\n\n${indentStr}return ${defaultName};` );
	}

	intro = introTemplate({
		amdName: options.amdName ? `'${options.amdName}', ` : '',
		amdDeps: bundle.externalModules.length ? '[' + bundle.externalModules.map( quoteId ).join( ', ' ) + '], ' : '',
		names: bundle.externalModules.map( m => bundle.uniqueNames[ m.id ] + '__default' ).join( ', ' )
	}).replace( /\t/g, indentStr );

	body.prepend( intro ).trim().append( '\n\n});' );
	return packageResult( body, options, 'toAmd', true );
}

function quoteId ( m ) {
	return "'" + m.id + "'";
}
