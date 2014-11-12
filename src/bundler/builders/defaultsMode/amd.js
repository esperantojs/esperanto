import template from '../../../utils/template';

var introTemplate = template( 'define(<%= amdDeps %>function (<%= names %>) {\n\n\t\'use strict\';\n\n' );

export default function amd ( bundle, body ) {
	var entry = bundle.entryModule,
		x,
		exportStatement,
		intro;

	if ( x = entry.exports[0] ) {
		exportStatement = body.indentStr + 'return ' + bundle.uniqueNames[ bundle.entry ] + '__default;';
		body.append( '\n\n' + exportStatement );
	}

	intro = introTemplate({
		amdDeps: bundle.externalModules.length ? '[' + bundle.externalModules.map( quoteId ).join( ', ' ) + '], ' : '',
		names: bundle.externalModules.map( m => bundle.uniqueNames[ m.id ] ).join( ', ' )
	}).replace( /\t/g, body.indentStr );

	body.prepend( intro ).trim().append( '\n\n});' );
	return body.toString();
}

function quoteId ( m ) {
	return "'" + m.id + "'";
}
