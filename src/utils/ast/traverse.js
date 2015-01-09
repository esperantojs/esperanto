import estraverse from 'estraverse';
import disallowIllegalReassignment from './disallowIllegalReassignment';
import replaceIdentifiers from './replaceIdentifiers';
import rewriteExportAssignments from './rewriteExportAssignments';

export default function traverseAst ( ast, body, identifierReplacements, importedBindings, importedNamespaces, exportNames, alreadyExported ) {
	var scope = ast._scope,
		blockScope = ast._blockScope,
		capturedUpdates = null,
		previousCapturedUpdates = null;

	estraverse.traverse( ast, {
		enter: function ( node ) {
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
				previousCapturedUpdates = capturedUpdates;
				capturedUpdates = [];
				return;
			}

			// Catch illegal reassignments
			disallowIllegalReassignment( node, importedBindings, importedNamespaces, scope );

			// Rewrite assignments to exports. This call may mutate `alreadyExported`
			// and `capturedUpdates`, which are used elsewhere
			rewriteExportAssignments( body, node, exportNames, scope, alreadyExported, scope === ast._scope, capturedUpdates );

			// Replace identifiers
			replaceIdentifiers( body, node, identifierReplacements, scope );

			// Replace top-level this with undefined ES6 8.1.1.5.4
			if ( node.type === 'ThisExpression' && node._topLevel ) {
				body.replace( node.start, node.end, 'undefined' );
			}
		},

		leave: function ( node ) {
			// Special case - see above
			if ( node.type === 'VariableDeclaration' ) {
				if ( capturedUpdates.length ) {
					body.insert( node.end, capturedUpdates.map( exportCapturedUpdate ).join( '' ) );
				}

				capturedUpdates = previousCapturedUpdates;
			}

			if ( node._scope ) {
				scope = scope.parent;
			} else if ( node._blockScope ) {
				blockScope = blockScope.parent;
			}
		}
	});
}

function exportCapturedUpdate ( c ) {
	return ` exports.${c.name} = ${c.exportAs};`;
}