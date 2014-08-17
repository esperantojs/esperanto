var recast = require( 'recast' ),
	acorn = require( 'acorn' );

module.exports = function ( source, options ) {
	var ast, body, numImports, exportCount = 0, importDeclarations, exportDeclarations, imports = [], exports = [];

	ast = acorn.parse( source.trim(), {
		ecmaVersion: 6
	});
	body = ast.body;

	numImports = body.filter( isImportDeclaration ).length;
	numExports = body.filter( isExportDeclaration ).length;

	i = body.length;
	while ( i-- ) {
		node = body[i];
		if ( isImportDeclaration( node ) || isExportDeclaration( node ) ) {
			spliceArgs = [ i, 1 ].concat( replace( node, i ) );
			body.splice.apply( body, spliceArgs );
		}
	}

	return {
		ast: ast,
		imports: imports,
		exports: exports
	};


	function replace ( node, nodeIndex ) {
		if ( isImportDeclaration( node ) ) {
			return replaceImport( node );
		}

		return replaceExport( node, nodeIndex );
	}

	function replaceImport ( node ) {
		var source, index, ast, varDeclarations = [];

		if ( options.defaultOnly && node.kind !== 'default' ) {
			throw new Error( 'A named import was used in defaultOnly mode' );
		}

		source = node.source.value;
		index = numImports - ( imports.push( source ) );

		node.specifiers.forEach( function ( specifier ) {
			var init, declaration;

			init = options.defaultOnly ? {
				type: 'Identifier',
				name: '__imports_' + index
			} : {
				type: 'MemberExpression',
				computed: false,
				object: {
					type: 'Identifier',
					name: '__imports_' + index
				},
				property: {
					type: 'Identifier',
					name: specifier.id.name
				}
			};

			declaration = {
				type: 'VariableDeclaration',
				declarations: [{
					type: 'VariableDeclarator',
					id: {
						type: 'Identifier',
						name: specifier.id.name
					},
					init: init
				}],
				kind: 'var'
			};

			varDeclarations.push( declaration );
		});

		return varDeclarations;
	}

	function replaceExport ( node, nodeIndex ) {
		var index, declarations = [], declaration, left, right, ast;

		index = numExports - exportCount++;

		if ( node.declaration ) {
			left = options.defaultOnly ? {
				type: 'Identifier',
				name: '__export'
			} : {
				type: 'MemberExpression',
				computed: false,
				object: {
					type: 'Identifier',
					name: 'exports'
				},
				property: {
					type: 'Identifier',
					name: 'default'
				}
			};

			declarations.push({
				type: 'ExpressionStatement',
				expression: {
					type: 'AssignmentExpression',
					operator: '=',
					left: left,
					right: node.declaration
				}
			});
		}

		else {
			if ( options.defaultOnly ) {
				throw new Error( 'A named export was used in defaultOnly mode' );
			}

			node.specifiers.forEach( function ( specifier ) {
				declarations.push({
					type: 'ExpressionStatement',
					expression: {
						type: 'AssignmentExpression',
						operator: '=',
						left: {
							type: 'MemberExpression',
							computed: false,
							object: {
								type: 'Identifier',
								name: 'exports'
							},
							property: {
								type: 'Identifier',
								name: specifier.id.name
							}
						},
						right: {
							type: 'Identifier',
							name:  specifier.id.name
						}
					}
				});

				//declarations.push( 'exports.' + specifier.id.name + ' = ' + specifier.id.name + ';' );
			});
		}

		return declarations;
	}
};

function isImportDeclaration ( node ) {
	return node.type === 'ImportDeclaration';
}

function isExportDeclaration ( node ) {
	return node.type === 'ExportDeclaration';
}
