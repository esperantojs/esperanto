import hasOwnProp from 'utils/hasOwnProp';

export default function disallowIllegalReassignment ( node, names, scope ) {
	var assignee, name, flag, message;

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
		flag = 'namespace';
	} else {
		message = 'Cannot reassign imported binding ';
		flag = 'readOnly';
	}

	if ( assignee.type !== 'Identifier' ) {
		return; // not assigning to a binding
	}

	name = assignee.name;

	if ( hasOwnProp.call( names, name ) && names[ name ][ flag ] && !scope.contains( name ) ) {
		throw new Error( message + '`' + name + '`' );
	}
}
