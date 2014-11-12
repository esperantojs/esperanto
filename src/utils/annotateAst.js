import estraverse from 'estraverse';

var Scope = function ( options ) {
	options = options || {};

	this.parent = options.parent;
	this.names = options.params || [];
};

Scope.prototype = {
	add: function ( name ) {
		this.names.push( name );
	},

	contains: function ( name ) {
		if ( ~this.names.indexOf( name ) ) {
			return true;
		}

		if ( this.parent ) {
			return this.parent.contains( name );
		}

		return false;
	}
};

export default function annotateAst ( ast ) {
	var scope = new Scope(), blockScope = new Scope();

	estraverse.traverse( ast, {
		enter: function ( node ) {
			if ( node.type === 'ImportDeclaration' ) {
				node._skip = true;
			}

			if ( node._skip ) {
				return this.skip();
			}

			if ( createsScope( node ) ) {
				if ( node.id ) {
					scope.add( node.id.name );
				}

				scope = node._scope = new Scope({
					parent: scope,
					params: node.params.map( x => x.name ) // TODO rest params?
				});
			}

			else if ( createsBlockScope( node ) ) {
				blockScope = node._blockScope = new Scope({
					parent: blockScope
				});
			}

			if ( declaresVar( node ) ) {
				scope.add( node.id.name );
			}

			else if ( declaresLet( node ) ) {
				blockScope.add( node.id.name );
			}

			// Make a note of which children we should skip
			if ( node.type === 'MemberExpression' && !node.computed ) {
				node.property._skip = true;
			}

			else if ( node.type === 'Property' ) {
				node.key._skip = true;
			}
		},
		leave: function ( node ) {
			if ( createsScope( node ) ) {
				scope = scope.parent;
			}

			else if ( createsBlockScope( node ) ) {
				blockScope = blockScope.parent;
			}
		}
	});

	ast._scope = scope;
	ast._blockScope = blockScope;
}

function createsScope ( node ) {
	return node.type === 'FunctionExpression' || node.type === 'FunctionDeclaration';
}

function createsBlockScope ( node ) {
	return node.type === 'BlockStatement';
}

function declaresVar ( node ) {
	return node.type === 'VariableDeclarator'; // TODO const, class? (function taken care of already)
}

function declaresLet ( node ) {
	return false; // TODO
}

