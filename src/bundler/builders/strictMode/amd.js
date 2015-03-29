import packageResult from 'utils/packageResult';
import { getId, getName, quote } from 'utils/mappers';
import getExportBlock from './utils/getExportBlock';

export default function amd ( bundle, options ) {
	let externalDefaults = bundle.externalModules.filter( needsDefault );
	let entry = bundle.entryModule;

	let importIds = bundle.externalModules.map( getId );
	let importNames = bundle.externalModules.map( getName );

	if ( externalDefaults.length ) {
		let defaultsBlock = externalDefaults.map( x => {
			// Case 1: default is used, and named is not
			if ( !x.needsNamed ) {
				return `${x.name} = ('default' in ${x.name} ? ${x.name}['default'] : ${x.name});`;
			}

			// Case 2: both default and named are used
			return `var ${x.name}__default = ('default' in ${x.name} ? ${x.name}['default'] : ${x.name});`;
		}).join( '\n' );

		bundle.body.prepend( defaultsBlock + '\n\n' );
	}

	if ( entry.exports.length ) {
		importIds.unshift( 'exports' );
		importNames.unshift( 'exports' );

		if ( entry.defaultExport ) {
			bundle.body.append( '\n\n' + getExportBlock( entry ) );
		}
	}

	let amdName = options.amdName ? `${quote(options.amdName)}, ` : '';
	let amdDeps = importIds.length ? '[' + importIds.map( quote ).join( ', ' ) + '], ' : '';
	let names = importNames.join( ', ' );

	let intro = `define(${amdName}${amdDeps}function (${names}) {

	'use strict';

`.replace( /\t/g, bundle.body.getIndentString() );

	bundle.body.indent().prepend( intro ).trimLines().append( '\n\n});' );
	return packageResult( bundle, bundle.body, options, 'toAmd', true );
}

function needsDefault ( externalModule ) {
	return externalModule.needsDefault;
}
