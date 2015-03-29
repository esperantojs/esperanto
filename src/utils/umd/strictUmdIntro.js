import { globalify, quote, req } from 'utils/mappers';
import { resolveAgainst } from 'utils/resolveId';

export default function strictUmdIntro ( options, indentStr ) {
	let hasExports = options.hasExports;

	let amdName = options.amdName ? `'${options.amdName}', ` : '';
	let amdDeps = hasExports || options.importPaths.length > 0 ?
		'[' +
			( hasExports ? [ 'exports' ] : [] ).concat( options.absolutePaths ? options.importPaths.map( resolveAgainst( options.amdName ) ) : options.importPaths ).map( quote ).join( ', ' ) +
		'], ' :
		'';
	let cjsDeps = ( hasExports ? [ 'exports' ] : [] ).concat( options.importPaths.map( req ) ).join( ', ' );
	let globalDeps = ( hasExports ? [ `(global.${options.name} = {})` ] : [] )
		.concat( options.importNames.map( globalify ) ).join( ', ' );
	let args = ( hasExports ? [ 'exports' ] : [] ).concat( options.importNames ).join( ', ' );

	let defaultsBlock = '';
	if ( options.externalDefaults && options.externalDefaults.length > 0 ) {
		defaultsBlock = options.externalDefaults.map( x =>
			'\t' + ( x.needsNamed ? `var ${x.name}__default` : x.name ) +
				` = ('default' in ${x.name} ? ${x.name}['default'] : ${x.name});`
		).join('\n') + '\n\n';
	}

	let intro =
`(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(${cjsDeps}) :
	typeof define === 'function' && define.amd ? define(${amdName}${amdDeps}factory) :
	factory(${globalDeps})
}(this, function (${args}) { 'use strict';

${defaultsBlock}`;

	return intro.replace( /\t/g, indentStr );
}
