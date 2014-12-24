import estraverse from 'estraverse';

export default function getUnscopedNames ( mod ) {
	var unscoped = {};

	var importedNames;
	function imported ( name ) {
		if (!importedNames) {
			importedNames = {};
			mod.imports.forEach(i => {
				!i.passthrough && i.specifiers.forEach(s => {
					importedNames[ s.batch ? s.name : s.as ] = true;
				});
			});
		}
		return importedNames.hasOwnProperty( name );
	}

	var scope;

	estraverse.traverse( mod.ast, {
		enter: function ( node, parent ) {
			// we're only interested in references, not property names etc
			if ( node._skip ) return this.skip();

			if ( node._scope ) {
				scope = node._scope;
			}

			if ( node.type === 'Identifier' &&
					 !scope.contains( node.name ) &&
					 !imported( node.name ) ) {
				unscoped[ node.name ] = true;
			}
		},

		leave: function ( node ) {
			if ( node.type === 'Program' ) {
				return;
			}

			if ( node._scope ) {
				scope = scope.parent;
			}
		}
	});

	return unscoped;
}
