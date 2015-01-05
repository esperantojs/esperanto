import template from '../../../utils/template';
import getExportBlock from './utils/getExportBlock';
import packageResult from '../../../utils/packageResult';
import { getId, globalify, quote, req } from 'utils/mappers';

var introTemplate;

export default function umd ( bundle, body, options ) {
	var defaultsBlock,
		entry = bundle.entryModule,
		importPaths,
		importNames,
		amdDeps,
		cjsDeps,
		globals,
		names,
		intro,
		indentStr;

	indentStr = body.getIndentString();

	if ( !options || !options.name ) {
		throw new Error( 'You must specify an export name, e.g. `bundle.toUmd({ name: "myModule" })`' );
	}

	defaultsBlock = bundle.externalModules.map( x => {
		var name = bundle.uniqueNames[ x.id ];
		return indentStr + `var ${name}__default = ('default' in ${name} ? ${name}['default'] : ${name});`;
	}).join( '\n' );

	if ( defaultsBlock ) {
		body.prepend( defaultsBlock + '\n\n' );
	}

	importPaths = bundle.externalModules.map( getId );
	importNames = bundle.externalModules.map( m => bundle.uniqueNames[ m.id ] );

	if ( entry.exports.length ) {
		amdDeps = [ 'exports' ].concat( importPaths ).map( quote ).join( ', ' );
		cjsDeps = [ 'exports' ].concat( importPaths.map( req ) ).join( ', ' );
		globals = [ options.name ].concat( importNames ).map( globalify ).join( ', ' );
		names   = [ 'exports' ].concat( importNames ).join( ', ' );

		if ( entry.defaultExport ) {
			body.append( '\n\n' + getExportBlock( entry, indentStr ) );
		}
	} else {
		amdDeps = importPaths.map( quote ).join( ', ' );
		cjsDeps = importPaths.map( req ).join( ', ' );
		globals = importNames.map( globalify ).join( ', ' );
		names   = importNames.join( ', ' );
	}

	intro = introTemplate({
		amdDeps: amdDeps,
		cjsDeps: cjsDeps,
		globals: globals,
		amdName: options.amdName ? `'${options.amdName}', ` : '',
		names: names,
		name: options.name
	}).replace( /\t/g, indentStr );

	body.prepend( intro ).trim().append( '\n\n}));' );
	return packageResult( body, options, 'toUmd', true );
}

introTemplate = template( `(function (global, factory) {

	'use strict';

	if (typeof define === 'function' && define.amd) {
		// export as AMD
		define(<%= amdName %>[<%= amdDeps %>], factory);
	} else if (typeof module !== 'undefined' && module.exports && typeof require === 'function') {
		// node/browserify
		factory(<%= cjsDeps %>);
	} else {
		// browser global
		global.<%= name %> = {};
		factory(<%= globals %>);
	}

}(typeof window !== 'undefined' ? window : this, function (<%= names %>) {

	'use strict';

` );
