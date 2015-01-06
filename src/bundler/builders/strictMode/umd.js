import getExportBlock from './utils/getExportBlock';
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

	var defaultsBlock = importNames.map( name =>
		`\tvar ${name}__default = ('default' in ${name} ? ${name}['default'] : ${name});`
	).join( '\n' );
	if ( defaultsBlock ) {
		defaultsBlock += '\n\n';
	}

	var amdName = options.amdName ? "'" + options.amdName + "', " : '';
	var amdDeps = importPaths.concat(hasExports ? ['exports'] : []).map( quote ).join( ', ' );
	var cjsDeps = importPaths.map( req ).concat(hasExports ? ['exports'] : []).join( ', ' );
	var name 	  = options.name;
	var globals = importNames.concat(hasExports ? [name] : []).map( globalify ).join( ', ' );
	var names   = importNames.concat(hasExports ? ['exports'] : []).join( ', ' );

	var cjsDefine = `factory(${cjsDeps})`;

	var globalDefine = hasExports ?
		`(global.${name} = {}, factory(${globals}))` :
		`factory(${globals})`

	var nonAMDDefine = cjsDefine === globalDefine ? globalDefine :
		`typeof exports === 'object' ? ${cjsDefine} :\n\t${globalDefine}`;

	body.prepend(
`(function (${needsGlobal ? 'global, ' : ''}factory) {
	typeof define === 'function' && define.amd ? define(${amdName}[${amdDeps}], factory) :
	${nonAMDDefine}
}(${needsGlobal ? 'this, ' : ''}function (${names}) { 'use strict';

${defaultsBlock}`.replace( /\t/g, indentStr )
	);

	body.trim();

	if ( entry.exports.length && entry.defaultExport ) {
		body.append( '\n\n' + getExportBlock( entry, indentStr ) );
	}

	body.append('\n\n}));');

	return packageResult( body, options, 'toUmd', true );
}
