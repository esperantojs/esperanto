import template from '../../../utils/template';
import getExportBlock from './utils/getExportBlock';

var introTemplate;

export default function umd ( bundle, body, options ) {
	var defaultsBlock,
		entry = bundle.entryModule,
		exportBlock,
		importPaths,
		importNames,
		amdDeps,
		cjsDeps,
		globals,
		names,
		intro;

	if ( !options || !options.name ) {
		throw new Error( 'You must specify an export name, e.g. `bundle.toUmd({ name: "myModule" })`' );
	}

	defaultsBlock = bundle.externalModules.map( x => {
		var name = bundle.uniqueNames[ x.id ];
		return body.indentStr + `var ${name}__default = ('default' in ${name} ? ${name}.default : ${name});`;
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

		exportBlock = getExportBlock( bundle, entry, body.indentStr );
		body.append( '\n\n' + exportBlock );
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
		names: names,
		name: options.name
	}).replace( /\t/g, body.indentStr );

	body.prepend( intro ).trim().append( '\n\n});' );
	return body.toString();
}

function getId ( m ) { return m.id; }

function quote ( str ) {
	return "'" + str + "'";
}

function req ( path ) {
	return 'require(\'' + path + '\')';
}

function globalify ( name ) {
	return 'global.' + name;
}

introTemplate = template( `(function (global, factory) {

	'use strict';

	if (typeof define === 'function' && define.amd) {
		// export as AMD
		define([<%= amdDeps %>], factory);
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
