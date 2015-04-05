import getImportSummary from './getImportSummary';
import processName from './processName';
import processIds from './processIds';

export default function amdIntro ({ name, imports, hasExports, indentStr, absolutePaths }) {
	let { ids, names } = getImportSummary({ name, imports, absolutePaths });

	if ( hasExports ) {
		ids.unshift( 'exports' );
		names.unshift( 'exports' );
	}

	let intro = `
define(${processName(name)}${processIds(ids)}function (${names.join( ', ' ) }) {

	'use strict';

`;

	return intro.replace( /\t/g, indentStr );
}