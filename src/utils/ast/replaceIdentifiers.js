import hasOwnProp from 'utils/hasOwnProp';

export default function rewriteIdentifiers ( body, node, identifierReplacements, scope ) {
	var name, replacement;

	if ( node.type === 'Identifier' ) {
		name = node.name;
		replacement = hasOwnProp.call( identifierReplacements, name ) && identifierReplacements[ name ].name;

		if ( replacement && !scope.contains( name, true ) ) {
			// rewrite
			body.replace( node.start, node.end, replacement );
		}
	}
}
