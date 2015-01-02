import estraverse from 'estraverse';

export default function getUnscopedNames ( mod ) {
	var unscoped = [], importedNames, scope;

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

	estraverse.traverse( mod.ast, {
		enter: function ( node ) {
			// we're only interested in references, not property names etc
			if ( node._skip ) return this.skip();

			if ( node._scope ) {
				scope = node._scope;
			}

			if ( node.type === 'Identifier' &&
					 !scope.contains( node.name ) &&
					 !imported( node.name ) &&
					 !~unscoped.indexOf( node.name ) ) {
				unscoped.push( node.name );
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