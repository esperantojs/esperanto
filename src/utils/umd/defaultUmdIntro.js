import { globalify, quote, req } from 'utils/mappers';
import { resolveAgainst } from 'utils/resolveId';

export default function defaultUmdIntro ( options, indentStr ) {
	var hasExports = options.hasExports;

	var amdName = options.amdName ?
		quote(options.amdName) + ", " :
		'';
	var amdDeps = options.importPaths.length > 0 ?
		'[' + ( options.absolutePaths ? options.importPaths.map( resolveAgainst( options.amdName ) ) : options.importPaths ).map( quote ).join( ', ' ) + '], ' :
		'';
	var cjsDeps = options.importPaths.map( req ).join( ', ' );
	var globalDeps = options.importNames.map( globalify ).join( ', ' );
	var args = options.importNames.join( ', ' );

	var cjsExport =
		(hasExports ? 'module.exports = ' : '') + `factory(${cjsDeps})`;

	var globalExport =
		(hasExports ? `global.${options.name} = ` : '') + `factory(${globalDeps})`;


	var intro =
`(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? ${cjsExport} :
	typeof define === 'function' && define.amd ? define(${amdName}${amdDeps}factory) :
	${globalExport}
}(this, function (${args}) { 'use strict';

`;

	return intro.replace( /\t/g, indentStr );
}