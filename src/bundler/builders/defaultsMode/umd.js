import packageResult from 'utils/packageResult';
import { getId, quote, req, globalify } from 'utils/mappers';

export default function umd ( bundle, body, options ) {
	if ( !options || !options.name ) {
		throw new Error( 'You must specify an export name, e.g. `bundle.toUmd({ name: "myModule" })`' );
	}

	var entry = bundle.entryModule;
	var indentStr = body.getIndentString();

	var hasImports = bundle.externalModules.length > 0;
	var hasExports = entry.exports.length > 0;
	var needsGlobal = hasImports || hasExports;

	var importPaths = bundle.externalModules.map( getId );
	var importNames = importPaths.map( path => bundle.uniqueNames[ path ] );

	var amdName = options.amdName ? "'" + options.amdName + "', " : '';
	var amdDeps = importPaths.map( quote ).join( ', ' );
	var cjsDeps = importPaths.map( req ).join( ', ' );
	var globals = importNames.map( globalify ).join( ', ' );
	var name = options.name;
	var names = importNames.map( name => name + '__default' ).join( ', ' );

	var cjsDefine = hasExports ?
		`module.exports = factory(${cjsDeps})` :
		`factory(${cjsDeps})`;

	var globalDefine = hasExports ?
		`global.${name} = factory(${globals})` :
		`factory(${globals})`

	var nonAMDDefine = cjsDefine === globalDefine ? globalDefine :
		`typeof exports === 'object' ? ${cjsDefine} :\n\t${globalDefine}`;

	body.prepend(
`(function (${needsGlobal ? 'global, ' : ''}factory) {
	typeof define === 'function' && define.amd ? define(${amdName}[${amdDeps}], factory) :
	${nonAMDDefine}
}(${needsGlobal ? 'this, ' : ''}function (${names}) { 'use strict';

`.replace( /\t/g, indentStr )
	);

	body.trim();

	var defaultName;
	if ( ( defaultName = entry.identifierReplacements.default ) ) {
		body.append( `\n\n${indentStr}return ${defaultName};` );
	}

	body.append('\n\n}));');

	return packageResult( body, options, 'toUmd', true );
}
