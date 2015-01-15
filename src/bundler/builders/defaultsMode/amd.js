import template from 'utils/template';
import packageResult from 'utils/packageResult';
import { getName, quote } from 'utils/mappers';

var introTemplate = template( 'define(<%= amdName %><%= amdDeps %>function (<%= names %>) {\n\n\t\'use strict\';\n\n' );

export default function amd ( bundle, body, options ) {
	var defaultName = bundle.entryModule.identifierReplacements.default;
	if ( defaultName ) {
		body.append( `\n\nreturn ${defaultName};` );
	}

	var intro = introTemplate({
		amdName: options.amdName ? `${quote(options.amdName)}, ` : '',
		amdDeps: bundle.externalModules.length ? '[' + bundle.externalModules.map( quoteId ).join( ', ' ) + '], ' : '',
		names: bundle.externalModules.map( getName ).join( ', ' )
	}).replace( /\t/g, body.getIndentString() );

	body.indent().prepend( intro ).trimLines().append( '\n\n});' );
	return packageResult( body, options, 'toAmd', true );
}

function quoteId ( m ) {
	return "'" + m.id + "'";
}