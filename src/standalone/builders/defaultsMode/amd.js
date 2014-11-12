var template = 'define(__IMPORT_PATHS__function (__IMPORT_NAMES__) {\n\n';

export default function amd ( mod, body, options ) {
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
		if ( isFunctionDeclaration( exportDeclaration ) ) {
			// special case - we have a situation like
			//
			//     export default function foo () {...}
			//
			// which needs to be rewritten
			//
			//     function foo () {...}
			//     export default foo
			body.remove( exportDeclaration.start, exportDeclaration.valueStart );
			exportedValue = exportDeclaration.node.declaration.id.name;
		} else {
			body.remove( exportDeclaration.start, exportDeclaration.next );
			exportedValue = exportDeclaration.value;
		}

		body.append( '\nreturn ' + exportedValue + ';' );
	}

	body.trim();

	if ( options.addUseStrict !== 'false' ) {
		body.prepend( "'use strict';\n\n" ).trim();
	}

	intro = template
		.replace( '__IMPORT_PATHS__', importPaths.length ? '[' + importPaths.map( quote ).join( ', ' ) + '], ' : '' )
		.replace( '__IMPORT_NAMES__', importNames.join( ', ' ) );

	body.indent().prepend( intro ).append( '\n\n});' );

	return body.toString();
}

function isFunctionDeclaration ( x ) {
	return x.node.declaration && x.node.declaration.type === 'FunctionExpression';
}

function quote ( str ) {
	return "'" + str + "'";
}
