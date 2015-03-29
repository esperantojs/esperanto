import { globalify, quote, req } from 'utils/mappers';
import { resolveAgainst } from 'utils/resolveId';

export default function defaultUmdIntro ( options, indentStr ) {
	let hasExports = options.hasExports;

	let amdName = options.amdName ? quote( options.amdName ) + ", " : '';
	let amdDeps = options.importPaths.length > 0 ?
		'[' + ( options.absolutePaths ? options.importPaths.map( resolveAgainst( options.amdName ) ) : options.importPaths ).map( quote ).join( ', ' ) + '], ' :
		'';
	let cjsDeps = options.importPaths.map( req ).join( ', ' );
	let globalDeps = options.importNames.map( globalify ).join( ', ' );
	let args = options.importNames.join( ', ' );

	let cjsExport =
		( hasExports ? 'module.exports = ' : '' ) + `factory(${cjsDeps})`;

	let globalExport =
		( hasExports ? `global.${options.name} = ` : '' ) + `factory(${globalDeps})`;


	let intro =
`(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? ${cjsExport} :
	typeof define === 'function' && define.amd ? define(${amdName}${amdDeps}factory) :
	${globalExport}
}(this, function (${args}) { 'use strict';

`;

	return intro.replace( /\t/g, indentStr );
}