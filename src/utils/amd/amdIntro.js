import { getId, getName, quote } from 'utils/mappers';

export default function amdIntro ({ name, imports, hasExports, indentStr }) {
	let paths = imports.map( getId );
	let names = imports.map( getName );

	if ( hasExports ) {
		paths.unshift( 'exports' );
		names.unshift( 'exports' );
	}

	return `define(${
		name ? quote(name) + ', ' : ''
}${
		paths.length ? '[' + paths.map( quote ).join( ', ' ) + '], ' : ''
}function (${
		names.join( ', ' )
}) {

	'use strict';

`.replace( /\t/g, indentStr );
}