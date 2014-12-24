import extend from 'utils/extend';
import traverseAst from 'utils/ast/traverse';
import gatherImports from './gatherImports';

export default function transformBody ( bundle, mod, body, prefix ) {
	var identifierReplacements = {},
		importIdentifierReplacements,
		exportNames,
		alreadyExported = {},
		shouldExportEarly = {},
		exportBlock,
		defaultValue,
		indentExclusionRanges = [];

	// All variables declared at the top level are given a prefix,
	// as an easy way to deconflict when two or more modules have the
	// same variable names. TODO deconflict more elegantly (see e.g.
	// https://github.com/Rich-Harris/esperanto/pull/24)
	mod.ast._scope.names.forEach( n => identifierReplacements[n] = prefix + '__' + n );
	mod.ast._blockScope.names.forEach( n => identifierReplacements[n] = prefix + '__' + n );

	importIdentifierReplacements = gatherImports( mod.imports, bundle.externalModuleLookup, bundle.chains, bundle.uniqueNames );
	extend( identifierReplacements, importIdentifierReplacements );

	exportNames = bundle.exports[ mod.id ];

	traverseAst( mod.ast, body, identifierReplacements, importIdentifierReplacements, exportNames, alreadyExported, indentExclusionRanges );

	// remove imports
	mod.imports.forEach( x => {
		if ( !x.passthrough ) {
			body.remove( x.start, x.next );
		}
	});

	// Remove export statements (but keep declarations)
	mod.exports.forEach( x => {
		var name;

		if ( x.default ) {
			if ( x.node.declaration && x.node.declaration.id && ( name = x.node.declaration.id.name ) ) {
				// if you have a default export like
				//
				//     export default function foo () {...}
				//
				// you need to rewrite it as
				//
				//     function foo () {...}
				//     exports.default = foo;
				//
				// as the `foo` reference may be used elsewhere
				defaultValue = body.slice( x.valueStart, x.end ); // in case rewrites occured inside the function body
				body.remove( x.start, x.valueStart );
				body.replace( x.end, x.end, '\nvar ' + prefix + '__default = ' + prefix + '__' + name + ';' );
			} else {
				// TODO this is a bit convoluted...
				if ( x.node.declaration && ( name = x.node.declaration.name ) ) {
					defaultValue = prefix + '__' + name;
					body.replace( x.start, x.end, 'var ' + prefix + '__default = ' + defaultValue + ';' );
				} else {
					body.replace( x.start, x.valueStart, 'var ' + prefix + '__default = ' );
				}
			}

			return;
		}

		if ( x.declaration ) {
			if ( x.node.declaration.type === 'FunctionDeclaration' ) {
				shouldExportEarly[ x.node.declaration.id.name ] = true; // TODO what about `function foo () {}; export { foo }`?
			}

			body.remove( x.start, x.valueStart );
		} else {
			body.remove( x.start, x.next );
		}
	});

	if ( mod._exportsNamespace ) {
		let namespaceExportBlock = 'var ' + prefix + ' = {\n',
			namespaceExports = [];

		mod.exports.forEach( x => {
			if ( x.declaration ) {
				namespaceExports.push( body.indentStr + 'get ' + x.name + ' () { return ' + prefix + '__' + x.name + '; }' );
			}

			else if ( x.default ) {
				namespaceExports.push( body.indentStr + 'get default () { return ' + prefix + '__default; }' );
			}

			else {
				x.specifiers.forEach( s => {
					namespaceExports.push( body.indentStr + 'get ' + s.name + ' () { return ' + s.name + '; }' );
				});
			}
		});

		namespaceExportBlock += namespaceExports.join( ',\n' ) + '\n};\n\n';

		body.prepend( namespaceExportBlock );
	}

	if ( exportNames ) {
		exportBlock = [];

		Object.keys( exportNames ).forEach( name => {
			var exportAs = exportNames[ name ],
				replacement = identifierReplacements[ name ];

			if ( !alreadyExported[ name ] ) {
				exportBlock.push( `exports.${exportAs} = ${replacement};` );
			}
		});

		if ( exportBlock.length ) {
			body.trim().append( '\n\n' + exportBlock.join( '\n' ) );
		}
	}

	body.trim().indent({ exclude: indentExclusionRanges });
}
