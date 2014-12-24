import estraverse from 'estraverse';
import disallowIllegalReassignment from '../../utils/disallowIllegalReassignment';
import rewriteIdentifiers from '../../utils/rewriteIdentifiers';
import gatherExports from './gatherExports';
import gatherImports from './gatherImports';
import getUnscopedNames from '../utils/getUnscopedNames';

export default function transformBody ( bundle, mod, body, prefix ) {
	var scope,
		scopeNames,
		blockScope,
		importedBindings = {},
		toRewrite = {},
		readOnly = {},
		exportNames = [],
		alreadyExported = {},
		shouldExportEarly = {},
		defaultValue,
		indentExclusionRanges = [];

	scope = mod.ast._scope;
	blockScope = mod.ast._blockScope;

	gatherImports(
		mod.imports,
		bundle.externalModuleLookup,
		importedBindings,
		toRewrite,
		bundle.chains,
		bundle.uniqueNames,
		bundle.conflicts
	);

	Object.keys( toRewrite ).forEach( k => readOnly[k] = toRewrite[k] );

	gatherExports( mod.exports, toRewrite, prefix, bundle.conflicts );
	//exportNames = getExportNames( mod.exports );

	scope.names.forEach( n => {
		if ( !toRewrite.hasOwnProperty( n ) ) {
			var unconflicted = bundle.conflicts.hasOwnProperty( n ) ?
				prefix + '__' + n :
				n;
			toRewrite[ n ] =  wasImported( bundle, mod, n ) ?
				'__' + unconflicted :
				unconflicted;
		}
	});

	var unscoped = getUnscopedNames( mod );

	// remove top-level names from scope. TODO is there a cleaner way to do this?
	scopeNames = scope.names;
	scope.names = [];

	estraverse.traverse( mod.ast, {
		enter: function ( node, parent ) {
			// we're only interested in references, not property names etc
			if ( node._skip ) return this.skip();

			if ( node._scope ) {
				scope = node._scope;
			} else if ( node._blockScope ) {
				blockScope = node._blockScope;
			}

			// Catch illegal reassignments
			disallowIllegalReassignment( node, readOnly, scope );

			// Rewrite assignments to exports
			rewriteExportAssignments( body, node, exportNames, scope, alreadyExported, ~mod.ast.body.indexOf( parent ) );

			// Rewrite import and export identifiers
			rewriteIdentifiers( body, node, toRewrite, scope, unscoped );

			// Add multi-line strings to exclusion ranges
			if ( node.type === 'TemplateLiteral' ) {
				indentExclusionRanges.push([ node.start, node.end ]);
			}
		},

		leave: function ( node ) {
			if ( node.type === 'Program' ) {
				return;
			}

			if ( node._scope ) {
				scope = scope.parent;
			} else if ( node._blockScope ) {
				blockScope = blockScope.parent;
			}
		}
	});

	scope.names = scopeNames;

	// remove imports
	mod.imports.forEach( x => {
		if ( !x.passthrough ) {
			body.remove( x.start, x.next );
		}
	});

	var defaultName = prefix;
	if ( bundle.conflicts.hasOwnProperty( prefix ) || mod._exportsNamespace ) {
		defaultName += '__default';
	}

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

				body.replace( x.end, x.end, '\nvar ' + defaultName + ' = ' + toRewrite[ name ] + ';');
			} else {
				// TODO this is a bit convoluted...
				if ( x.node.declaration && ( name = x.node.declaration.name ) ) {
					defaultValue = toRewrite[ name ];
					body.replace( x.start, x.end, 'var ' + defaultName + ' = ' + defaultValue + ';');
				} else {
					body.replace( x.start, x.valueStart, 'var ' + defaultName + ' = ');
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
				namespaceExports.push( body.indentStr + 'get ' + x.name + ' () { return ' + toRewrite[ x.name ] + '; }' );
			}

			else if ( x.default ) {
				namespaceExports.push( body.indentStr + 'get default () { return ' + defaultName + '; }' );
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

	body.trim().indent({ exclude: indentExclusionRanges });
}

function rewriteExportAssignments ( body, node, exports, scope, alreadyExported, isTopLevelNode ) {
	var assignee, name;

	if ( node.type === 'AssignmentExpression' ) {
		assignee = node.left;
	} else if ( node.type === 'UpdateExpression' ) {
		assignee = node.argument;
	} else {
		return; // not an assignment
	}

	if ( assignee.type !== 'Identifier' ) {
		return;
	}

	name = assignee.name;
	if ( ~exports.indexOf( name ) ) {
		// special case - increment/decrement operators
		if ( node.operator === '++' || node.operator === '--' ) {
			body.replace( node.end, node.end, `, exports.${name} = ${name}` );
		} else {
			body.replace( node.start, node.start, `exports.${name} = ` );
		}

		// keep track of what we've already exported - we don't need to
		// export it again later
		if ( isTopLevelNode ) {
			alreadyExported[ name ] = true;
		}
	}
}

function wasImported ( bundle, mod, name ) {
	return (
		bundle.importsByModule.hasOwnProperty( mod.id ) &&
		bundle.importsByModule[ mod.id ].hasOwnProperty( name )
	);
}
