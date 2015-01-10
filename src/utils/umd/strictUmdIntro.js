import { globalify, quote, req } from 'utils/mappers';

export default function strictUmdIntro ( options, indentStr ) {
	var hasExports = options.hasExports;

	var amdName = options.amdName ?
		"'" + options.amdName + "', " :
		'';
	var amdDeps = hasExports || options.importPaths.length > 0 ?
		'[' +
			( hasExports ? [ 'exports' ] : [] ).concat( options.importPaths ).map( quote ).join( ', ' ) +
		'], ' :
		'';
	var cjsDeps = ( hasExports ? [ 'exports' ] : [] ).concat( options.importPaths.map( req ) ).join( ', ' );
	var globalDeps = ( hasExports ? [ `(global.${options.name} = {})` ] : [] )
		.concat( options.importNames.map( globalify ) ).join( ', ' );
	var args = ( hasExports ? [ 'exports' ] : [] ).concat( options.importNames ).join( ', ' );

	var defaultsBlock = '';
	if ( options.externalDefaults && options.externalDefaults.length > 0 ) {
		defaultsBlock = options.externalDefaults.map( x =>
			'\t' + ( x.needsNamed ? `var ${x.name}__default` : x.name ) +
				` = ('default' in ${x.name} ? ${x.name}['default'] : ${x.name});`
		).join('\n') + '\n\n';
	}

	var intro =
`(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(${cjsDeps}) :
	typeof define === 'function' && define.amd ? define(${amdName}${amdDeps}factory) :
	factory(${globalDeps})
}(this, function (${args}) { 'use strict';

${defaultsBlock}`

	return intro.replace( /\t/g, indentStr );
}
