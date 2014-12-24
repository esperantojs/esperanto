import template from '../../../utils/template';
import packageResult from '../../../utils/packageResult';

var introTemplate = template( 'define(<%= amdDeps %>function (<%= names %>) {\n\n\t\'use strict\';\n\n' );

export default function amd ( bundle, body, options ) {
	var entry = bundle.entryModule,
		x,
		exportStatement,
		intro,
		indentStr;

	indentStr = body.getIndentString();

	if ( x = entry.exports[0] ) {
		var name = bundle.uniqueNames[ bundle.entry ];
		if ( bundle.conflicts.hasOwnProperty( name ) ) {
			name += '__default';
		}
		exportStatement = indentStr + 'return ' + name + ';';
		body.append( '\n\n' + exportStatement );
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
