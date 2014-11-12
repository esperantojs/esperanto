import template from '../../../utils/template';

var introTemplate;

export default function umd ( bundle, body, options ) {
	var x,
		entry = bundle.entryModule,
		exportStatement,
		amdDeps,
		cjsDeps,
		globals,
		intro;

	if ( !options || !options.name ) {
		throw new Error( 'You must specify an export name, e.g. `bundle.toUmd({ name: "myModule" })`' );
	}

	if ( x = entry.exports[0] ) {
		exportStatement = body.indentStr + 'return ' + bundle.uniqueNames[ bundle.entry ] + '__default;';
		body.append( '\n\n' + exportStatement );
	}

	amdDeps = bundle.externalModules.map( quoteId ).join( ', ' );
	cjsDeps = bundle.externalModules.map( req ).join( ', ' );
	globals = bundle.externalModules.map( m => 'global.' + bundle.uniqueNames[ m.id ] ).join( ', ' );

	intro = introTemplate({
		amdDeps: amdDeps,
		cjsDeps: cjsDeps,
		globals: globals,
		name: options.name,
		names: bundle.externalModules.map( m => bundle.uniqueNames[ m.id ] + '__default' ).join( ', ' )
	}).replace( /\t/g, body.indentStr );

	body.prepend( intro ).trim().append( '\n\n}));' );
	return body.toString();
}

function quoteId ( m ) {
	return "'" + m.id + "'";
}

function req ( m ) {
	return 'require(\'' + m.id + '\')';
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
