import template from 'utils/template';
import packageResult from 'utils/packageResult';
import { getId, quote, req } from 'utils/mappers';

var introTemplate;

export default function umd ( bundle, body, options ) {
	var externalModuleIds,
		amdDeps,
		cjsDeps,
		globals,
		intro,
		indentStr,
		defaultName;

	indentStr = body.getIndentString();

	if ( !options || !options.name ) {
		throw new Error( 'You must specify an export name, e.g. `bundle.toUmd({ name: "myModule" })`' );
	}

	if ( defaultName = bundle.entryModule.identifierReplacements.default ) {
		body.append( `\n\n${indentStr}return ${defaultName};` );
	}

	externalModuleIds = bundle.externalModules.map( getId );

	amdDeps = externalModuleIds.map( quote ).join( ', ' );
	cjsDeps = externalModuleIds.map( req ).join( ', ' );
	globals = externalModuleIds.map( id => 'global.' + bundle.uniqueNames[ id ] ).join( ', ' );

	intro = introTemplate({
		amdDeps: amdDeps,
		cjsDeps: cjsDeps,
		globals: globals,
		name: options.name,
		names: externalModuleIds.map( id => bundle.uniqueNames[ id ] + '__default' ).join( ', ' )
	}).replace( /\t/g, indentStr );

	body.prepend( intro ).trim().append( '\n\n}));' );
	return packageResult( body, options, 'toUmd', true );
}

introTemplate = template( `(function (global, factory) {

	'use strict';

	if (typeof define === 'function' && define.amd) {
		// export as AMD
		define([<%= amdDeps %>], factory);
	} else if (typeof module !== 'undefined' && module.exports && typeof require === 'function') {
		// node/browserify
		module.exports = factory(<%= cjsDeps %>);
	} else {
		// browser global
		global.<%= name %> = factory(<%= globals %>);
	}

}(typeof window !== 'undefined' ? window : this, function (<%= names %>) {

	'use strict';

` );
