export default function rewriteIdentifiers ( body, node, toRewrite, scope ) {
	var name, replacement;

	if ( node.type === 'Identifier' ) {
		name = node.name;
		replacement = toRewrite[ name ];

		if ( replacement && !scope.contains( name ) ) {
			// rewrite
			body.replace( node.start, node.end, replacement );
		}
	}
}