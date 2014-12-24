export default function disallowIllegalReassignment ( node, readOnlyNames, scope ) {
	var assignee, name, message;

	if ( node.type === 'AssignmentExpression' ) {
		assignee = node.left;
	} else if ( node.type === 'UpdateExpression' ) {
		assignee = node.argument;
	} else {
		return; // not an assignment
	}

	if ( assignee.type === 'MemberExpression' ) {
		assignee = assignee.object;
		message = 'Cannot reassign imported binding of namespace ';
	} else {
		message = 'Cannot reassign imported binding ';
	}

	if ( assignee.type !== 'Identifier' ) {
		return; // not assigning to a binding
	}

	name = assignee.name;

	if ( readOnlyNames.hasOwnProperty( name ) && !scope.contains( name ) ) {
		throw new Error( message + '`' + name + '`' );
	}
}
