import hasOwnProp from 'utils/hasOwnProp';

export default function rewriteExportAssignments ( body, node, exports, scope, alreadyExported, isTopLevelNode, capturedUpdates ) {
	var assignee, name, exportAs;

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

	if ( scope.contains( name, true ) ) {
		return; // shadows an export
	}

	if ( exports && hasOwnProp.call( exports, name ) && ( exportAs = exports[ name ] ) ) {
		if ( !!capturedUpdates ) {
			capturedUpdates.push({
				name: name,
				exportAs: exportAs
			});
			return;
		}

		// special case - increment/decrement operators
		if ( node.operator === '++' || node.operator === '--' ) {
			body.replace( node.end, node.end, `, exports.${exportAs} = ${name}` );
		} else {
			body.replace( node.start, node.start, `exports.${exportAs} = ` );
		}

		// keep track of what we've already exported - we don't need to
		// export it again later
		if ( isTopLevelNode ) {
			alreadyExported[ name ] = true;
		}
	}
}