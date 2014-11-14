import template from '../../../utils/template';

var introTemplate = template( `(function (global, factory) {

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

export default function umd ( mod, body, options ) {
	var importNames = [],
		importPaths = [],
		exportDeclaration,
		exportedValue,
		intro,
		i;

	// ensure empty imports are at the end
	i = mod.imports.length;
	while ( i-- ) {
		if ( !mod.imports[i].specifiers.length ) {
			mod.imports.splice( mod.imports.length - 1, 0, mod.imports.splice( i, 1 )[0] );
		}
	}

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

	exportDeclaration = mod.exports[0];

	if ( exportDeclaration ) {
		switch ( exportDeclaration.type ) {
			case 'namedFunction':
			body.remove( exportDeclaration.start, exportDeclaration.valueStart );
			exportedValue = exportDeclaration.name;
			break;

			case 'anonFunction':
			body.replace( exportDeclaration.start, exportDeclaration.valueStart, 'var __export = ' );
			exportedValue = '__export';
			break;

			case 'expression':
			body.remove( exportDeclaration.start, exportDeclaration.next );
			exportedValue = exportDeclaration.value;
			break;

			default:
			throw new Error( 'Unexpected export type' );
		}

		body.append( '\nreturn ' + exportedValue + ';' );
	}

	body.trim();

	if ( options.addUseStrict !== 'false' ) {
		body.prepend( "'use strict';\n\n" ).trim();
	}

	intro = introTemplate({
		AMD_DEPS: importPaths.length ? '[' + importPaths.map( quote ).join( ', ' ) + '], ' : '',
		CJS_DEPS: importPaths.map( req ).join( ', ' ),
		GLOBAL_DEPS: importNames.map( globalify ).join( ', ' ),
		IMPORT_NAMES: importNames.join( ', ' ),
		NAME: options.name
	}).replace( /\t/g, body.indentStr );

	body.indent().prepend( intro ).append( '\n\n}));' );

	return body.toString();
}

function isFunctionDeclaration ( x ) {
	return x.node.declaration && x.node.declaration.type === 'FunctionExpression';
}

function quote ( str ) {
	return "'" + str + "'";
}

function req ( path ) {
	return `require('${path}')`;
}

function globalify ( name ) {
	return `global.${name}`;
}
