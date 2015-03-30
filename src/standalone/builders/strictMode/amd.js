import packageResult from '../../../utils/packageResult';
import { resolveAgainst } from '../../../utils/resolveId';
import transformBody from './utils/transformBody';
import getImportSummary from './utils/getImportSummary';
import { quote } from '../../../utils/mappers';

export default function amd ( mod, options ) {
	let [ importPaths, importNames ] = getImportSummary( mod );

	if ( mod.exports.length ) {
		importPaths.unshift( 'exports' );
		importNames.unshift( 'exports' );
	}

	let amdName = options.amdName ? `'${options.amdName}', ` : '';
	let paths = importPaths.length ? '[' + ( options.absolutePaths ? importPaths.map( resolveAgainst( options.amdName ) ) : importPaths ).map( quote ).join( ', ' ) + '], ' : '';
	let names = importNames.join( ', ' );

	let intro = `define(${amdName}${paths}function (${names}) {

	'use strict';

`.replace( /\t/g, mod.body.getIndentString() );

	transformBody( mod, mod.body, {
		intro,
		outro: '\n\n});',
		_evilES3SafeReExports: options._evilES3SafeReExports
	});

	return packageResult( mod, mod.body, options, 'toAmd' );
}
