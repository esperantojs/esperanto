import template from 'utils/template';
import packageResult from 'utils/packageResult';
import { getId, quote } from 'utils/mappers';
import getExportBlock from './utils/getExportBlock';

var introTemplate = template( 'define(<%= amdName %><%= amdDeps %>function (<%= names %>) {\n\n\t\'use strict\';\n\n' );

export default function amd ( bundle, body, options ) {
	var externalDefaults = bundle.externalModules.filter( needsDefault );
	var entry = bundle.entryModule;

	var importIds = bundle.externalModules.map( getId );
	var importNames = importIds.map( id => bundle.uniqueNames[ id ] );

	if ( externalDefaults.length ) {
		var defaultsBlock = externalDefaults.map( x => {
			var name = bundle.uniqueNames[ x.id ];

			// Case 1: default is used, and named is not
			if ( !x.needsNamed ) {
				return `${name} = ('default' in ${name} ? ${name}['default'] : ${name});`;
			}

			// Case 2: both default and named are used
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

	body.indent().prepend( intro ).trimLines().append( '\n\n});' );
	return packageResult( body, options, 'toAmd', true );
}

function needsDefault ( externalModule ) {
	return externalModule.needsDefault;
}
