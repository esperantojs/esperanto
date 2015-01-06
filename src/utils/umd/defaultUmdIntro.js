import { globalify, quote, req } from 'utils/mappers';

export default function defaultUmdIntro ( options, indentStr ) {
	var intro, amdName, needsGlobal, amdDeps, cjsDeps, globalDeps, args, cjsDefine, globalDefine, nonAMDDefine;

	amdName     = options.amdName ? `'${options.amdName}', ` : '';
	needsGlobal = options.hasImports || options.hasExports;

	amdDeps     = options.importPaths.map( quote ).join( ', ' );
	cjsDeps     = options.importPaths.map( req ).join( ', ' );
	globalDeps  = options.importNames.map( globalify ).join( ', ' );
	
	args        = ( options.args || options.importNames ).join( ', ' );

	cjsDefine = options.hasExports ?
		`module.exports = factory(${cjsDeps})` :
		`factory(${cjsDeps})`;

	globalDefine = options.hasExports ?
		`global.${options.name} = factory(${globalDeps})` :
		`factory(${globalDeps})`;

	nonAMDDefine = cjsDefine === globalDefine ? globalDefine :
		`typeof exports === 'object' ? ${cjsDefine} :\n\t${globalDefine}`;

	intro =
`(function (${needsGlobal ? 'global, ' : ''}factory) {
	typeof define === 'function' && define.amd ? define(${amdName}[${amdDeps}], factory) :
	${nonAMDDefine}
}(${needsGlobal ? 'this, ' : ''}function (${args}) { 'use strict';

`.replace( /\t/g, indentStr );

	return intro;
}