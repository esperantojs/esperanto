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
		var specifier;

		importPaths[i] = x.path;

		specifier = x.specifiers[0];
		if ( specifier ) {
			importNames[i] = specifier.batch ? specifier.name : specifier.as;
		}

		body.remove( x.start, x.next );
	});

	transformExportDeclaration( mod.exports[0], body );

	body.trim();

	body.prepend( "'use strict';\n\n" ).trim();

	intro = introTemplate({
		AMD_DEPS: importPaths.length ? '[' + importPaths.map( quote ).join( ', ' ) + '], ' : '',
		CJS_DEPS: importPaths.map( req ).join( ', ' ),
		GLOBAL_DEPS: importNames.map( globalify ).join( ', ' ),
		IMPORT_NAMES: importNames.join( ', ' ),
		NAME: options.name
	}).replace( /\t/g, body.indentStr );

	body.indent().prepend( intro ).append( '\n\n}));' );

	return packageResult( body, options, 'toUmd' );
}

introTemplate = template( `(function (global, factory) {

	'use strict';

	if (typeof define === 'function' && define.amd) {
		// export as AMD
		define(<%= AMD_DEPS %>factory);
	} else if (typeof module !== 'undefined' && module.exports && typeof require === 'function') {
		// node/browserify
		module.exports = factory(<%= CJS_DEPS %>);
	} else {
		// browser global
		global.<%= NAME %> = factory(<%= GLOBAL_DEPS %>);
	}

}(typeof window !== 'undefined' ? window : this, function (<%= IMPORT_NAMES %>) {

` );
