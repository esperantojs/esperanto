import template from '../../../utils/template';
import reorderImports from './utils/reorderImports';
import transformBody from './utils/transformBody';

var introTemplate;

export default function umd ( mod, body, options ) {
	var importPaths = [],
		importNames = [],
		intro,
		i;

	reorderImports( mod.imports );

	// gather imports, and remove import declarations
	mod.imports.forEach( ( x, i ) => {
		importPaths[i] = x.path;

		if ( x.specifiers.length ) {
			importNames[i] = mod.getName( x.path );// '__imports_' + i;//x.name;
		}
	});

	intro = introTemplate({
		amdDeps: [ 'exports' ].concat( importPaths ).map( quote ).join( ', ' ),
		cjsDeps: [ 'exports' ].concat( importPaths.map( req ) ).join( ', ' ),
		globals: [ `global.${options.name}` ].concat( importNames.map( globalify ) ).join( ', ' ),
		names: [ 'exports' ].concat( importNames ).join( ', ' ),
		name: options.name
	}).replace( /\t/g, body.indentStr );

	transformBody( mod, body, {
		intro: intro,
		outro: '\n\n}));'
	});

	return body.toString();
}

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
