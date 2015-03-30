import resolveId from '../resolveId';
import { quote } from '../mappers';

export default function amdIntro ({ name, imports, hasExports, indentStr, absolutePaths }) {
	let paths = [];
	let names = [];
	let seen = {};
	let placeholders = 0;

	imports.forEach( x => {
		let path = x.id || x.path; // TODO unify these

		if ( absolutePaths ) {
			path = resolveId( path, name );
		}

		if ( !seen[ path ] ) {
			seen[ path ] = true;

			paths.push( path );

			// TODO x could be an external module, or an internal one.
			// they have different shapes, resulting in the confusing
			// code below
			if ( ( x.needsDefault || x.needsNamed ) || ( x.specifiers && x.specifiers.length ) ) {
				while ( placeholders ) {
					names.push( `__dep${names.length}__` );
					placeholders--;
				}
				names.push( x.name );
			} else {
				placeholders++;
			}
		}
	});

	if ( hasExports ) {
		paths.unshift( 'exports' );
		names.unshift( 'exports' );
	}

	let intro = `
define(${processName(name)}${processPaths(paths)}function (${names.join( ', ' ) }) {

	'use strict';

`;

	return intro.replace( /\t/g, indentStr );
}

function processName ( name ) {
	return name ? quote( name ) + ', ' : '';
}

function processPaths ( paths ) {
	return paths.length ? '[' + paths.map( quote ).join( ', ' ) + '], ' : '';
}