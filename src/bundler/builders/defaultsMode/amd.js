import packageResult from 'utils/packageResult';
import { getName, quote } from 'utils/mappers';

export default function amd ( bundle, options ) {
	let defaultName = bundle.entryModule.identifierReplacements.default;
	if ( defaultName ) {
		bundle.body.append( `\n\nreturn ${defaultName};` );
	}

	let amdName = options.amdName ? `${quote(options.amdName)}, ` : '';
	let amdDeps = bundle.externalModules.length ? '[' + bundle.externalModules.map( quoteId ).join( ', ' ) + '], ' : '';
	let names = bundle.externalModules.map( getName ).join( ', ' );

	let intro = `define(${amdName}${amdDeps}function (${names}) {

	'use strict';

`.replace( /\t/g, bundle.body.getIndentString() );

	bundle.body.indent().prepend( intro ).trimLines().append( '\n\n});' );
	return packageResult( bundle, bundle.body, options, 'toAmd', true );
}

function quoteId ( m ) {
	return "'" + m.id + "'";
}
