export default function rewriteIdentifiers ( body, node, toRewrite, scope, unscoped ) {
	var name, replacement;

	if ( node.type === 'Identifier' ) {
		name = node.name;
		replacement = toRewrite.hasOwnProperty( name ) && toRewrite[ name ];

		if ( replacement &&
				 !scope.contains( name ) &&
				 !(unscoped && unscoped.hasOwnProperty( name )) ) {
			// rewrite
			body.replace( node.start, node.end, replacement );
		}
	}
}
