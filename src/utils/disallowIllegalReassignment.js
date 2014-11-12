export default function disallowIllegalReassignment ( node, names, scope ) {
	var assignee, name, replacement, message;

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
	replacement = names[ name ];

	if ( !!replacement && !scope.contains( name ) ) {
		throw new Error( message + '`' + name + '`' );
	}
}