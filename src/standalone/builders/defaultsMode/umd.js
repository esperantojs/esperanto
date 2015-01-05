import transformExportDeclaration from './utils/transformExportDeclaration';
import packageResult from '../../../utils/packageResult';
import template from '../../../utils/template';
import reorderImports from 'utils/reorderImports';
import { globalify, quote, req } from 'utils/mappers';

var introTemplate;

export default function umd ( mod, body, options ) {
	var importNames = [],
		importPaths = [],
		intro,
		i;

	if ( !options.name ) {
		throw new Error( 'You must supply a `name` option for UMD modules' );
	}

	// ensure empty imports are at the end
	reorderImports( mod.imports );

	// gather imports, and remove import declarations
	mod.imports.forEach( ( x, i ) => {
		importPaths[i] = x.path;

		if ( x.name ) {
			importNames[i] = x.name;
		}

		body.remove( x.start, x.next );
	});

	transformExportDeclaration( mod.exports[0], body );

	intro = introTemplate({
		amdDeps: importPaths.length ? '[' + importPaths.map( quote ).join( ', ' ) + '], ' : '',
		cjsDeps: importPaths.map( req ).join( ', ' ),
		globals: importNames.map( globalify ).join( ', ' ),
		amdName: options.amdName ? `'${options.amdName}', ` : '',
		names: importNames.join( ', ' ),
		name: options.name
	}).replace( /\t/g, body.indentStr );

	body.trim()
		.prepend( "'use strict';\n\n" )
		.trim()
		.indent()
		.prepend( intro )
		.append( '\n\n}));' );

	return packageResult( body, options, 'toUmd' );
}

introTemplate = template( `(function (global, factory) {

	'use strict';

	if (typeof define === 'function' && define.amd) {
		// export as AMD
		define(<%= amdName %><%= amdDeps %>factory);
	} else if (typeof module !== 'undefined' && module.exports && typeof require === 'function') {
		// node/browserify
		module.exports = factory(<%= cjsDeps %>);
	} else {
		// browser global
		global.<%= name %> = factory(<%= globals %>);
	}

}(typeof window !== 'undefined' ? window : this, function (<%= names %>) {

` );
