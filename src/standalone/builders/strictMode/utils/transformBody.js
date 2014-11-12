import estraverse from 'estraverse';
import gatherImports from './gatherImports';
import getExportNames from './getExportNames';
import disallowIllegalReassignment from '../../../../utils/disallowIllegalReassignment';
import rewriteIdentifiers from '../../../../utils/rewriteIdentifiers';

export default function transformBody ( mod, body, options ) {
	var scope,
		blockScope,
		importedBindings = {},
		toRewrite = {},
		exportNames = [],
		alreadyExported = {},
		shouldExportEarly = {},
		earlyExports,
		lateExports,
		defaultValue,
		capturedUpdates = null,
		indentExclusionRanges = [];

	scope = mod.ast._scope;
	blockScope = mod.ast._blockScope;

	gatherImports( mod.imports, mod.getName, importedBindings, toRewrite );
	exportNames = getExportNames( mod.exports );

	// scope is now the global scope
	estraverse.traverse( mod.ast, {
		enter: function ( node, parent ) {
			// we're only interested in references, not property names etc
			if ( node._skip ) return this.skip();

			if ( node._scope ) {
				scope = node._scope;
			} else if ( node._blockScope ) {
				blockScope = node._blockScope;
			}

			// Special case: if you have a variable declaration that updates existing
			// bindings as a side-effect, e.g. `var a = b++`, where `b` is an exported
			// value, we can't simply append `exports.b = b` to the update (as we
			// normally would) because that would be syntactically invalid. Instead,
			// we capture the change and update the export (and any others) after the
			// variable declaration
			if ( node.type === 'VariableDeclaration' ) {
				let previous = capturedUpdates;
				capturedUpdates = [];
				capturedUpdates.previous = previous;
			}

			// Catch illegal reassignments
			disallowIllegalReassignment( node, toRewrite, scope );

			// Rewrite assignments to exports
			rewriteExportAssignments( body, node, exportNames, scope, alreadyExported, ~mod.ast.body.indexOf( parent ), capturedUpdates );

			// Rewrite import identifiers
			rewriteIdentifiers( body, node, toRewrite, scope );

			// Add multi-line strings to exclusion ranges
			if ( node.type === 'TemplateLiteral' ) {
				indentExclusionRanges.push([ node.start, node.end ]);
			}
		},

		leave: function ( node ) {
			// Special case - see above
			if ( node.type === 'VariableDeclaration' ) {
				if ( capturedUpdates.length ) {
					body.replace( node.end, node.end, capturedUpdates.map( n => ` exports.${n} = ${n};` ).join( '' ) );
				}

				capturedUpdates = capturedUpdates.previous;
			}

			if ( node._scope ) {
				scope = scope.parent;
			} else if ( node._blockScope ) {
				blockScope = blockScope.parent;
			}
		}
	});

	// Remove import statements
	mod.imports.forEach( x => {
		if ( x.passthrough ) return; // this is an `export { foo } from './bar'` statement
		body.remove( x.start, x.next );
	});

	// Remove export statements (but keep declarations)
	mod.exports.forEach( x => {
		var name;

		if ( x.default ) {
			defaultValue = body.slice( x.valueStart, x.end );
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
				body.replace( x.start, x.end, defaultValue + '\nexports.default = ' + name + ';' );
			} else {
				body.replace( x.start, x.end, 'exports.default = ' + defaultValue );
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

	// Append export block (this is the same for all module types, unlike imports)
	earlyExports = [];
	lateExports = [];

	exportNames.forEach( name => {
		var chain;

		if ( chain = importedBindings[ name ] ) {
			// special case - a binding from another module
			earlyExports.push( `Object.defineProperty(exports, '${name}', { get: function () { return ${chain}; }});` );
		} else if ( shouldExportEarly[ name ] ) {
			earlyExports.push( `exports.${name} = ${name};` );
		} else if ( !alreadyExported[ name ] ) {
			lateExports.push( `exports.${name} = ${name};` );
		}
	});

	if ( lateExports.length ) {
		body.trim().append( '\n\n' + lateExports.join( '\n' ) );
	}

	// Prepend require() statements
	if ( options.header ) {
		body.prepend( options.header + '\n\n' );
	}

	// Function exports should be exported immediately after 'use strict'
	if ( earlyExports.length ) {
		body.trim().prepend( earlyExports.join( '\n' ) + '\n\n' );
	}

	body.trim().indent({
		exclude: indentExclusionRanges.length ? indentExclusionRanges : null
	}).prepend( options.intro ).trim().append( options.outro );
}

function rewriteExportAssignments ( body, node, exports, scope, alreadyExported, isTopLevelNode, capturedUpdates ) {
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
		if ( !!capturedUpdates ) {
			capturedUpdates.push( name );
			return;
		}

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
