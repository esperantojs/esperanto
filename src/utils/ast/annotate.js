/*
	This module traverse a module's AST, attaching scope information
	to nodes as it goes, which is later used to determine which
	identifiers need to be rewritten to avoid collisions
*/

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

	contains: function ( name, ignoreTopLevel ) {
		if ( ignoreTopLevel && !this.parent ) {
			return false;
		}

		if ( ~this.names.indexOf( name ) ) {
			return true;
		}

		if ( this.parent ) {
			return this.parent.contains( name, ignoreTopLevel );
		}

		return false;
	}
};

export default function annotateAst ( ast ) {
	var scope = new Scope(), blockScope = new Scope(), declared = {}, templateLiteralRanges = [];

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
					declared[ node.id.name ] = true;
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
				declared[ node.id.name ] = true;
			}

			else if ( declaresLet( node ) ) {
				blockScope.add( node.id.name );
				declared[ node.id.name ] = true;
			}

			// Make a note of which children we should skip
			if ( node.type === 'MemberExpression' && !node.computed ) {
				node.property._skip = true;
			}

			else if ( node.type === 'Property' ) {
				node.key._skip = true;
			}

			// make a note of template literals - we want to prevent multiline
			// strings from being indented with everything else
			if ( node.type === 'TemplateLiteral' ) {
				templateLiteralRanges.push([ node.start, node.end ]);
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
	ast._declared = declared;
	ast._templateLiteralRanges = templateLiteralRanges;
}

function createsScope ( node ) {
	return node.type === 'FunctionExpression' || node.type === 'FunctionDeclaration';
}

function createsBlockScope ( node ) {
	return node.type === 'BlockStatement';
}

function declaresVar ( node ) {
	// TODO const? (function taken care of already)
	return (
		node.type === 'VariableDeclarator' ||
		node.type === 'ClassExpression' ||
		node.type === 'ClassDeclaration'
	);
}

function declaresLet ( node ) {
	return false; // TODO
}
