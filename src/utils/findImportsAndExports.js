export default function findImportsAndExports ( mod, source, ast, imports, exports ) {
	var previousDeclaration;

	ast.body.forEach( node => {
		var passthrough, declaration;

		if ( previousDeclaration ) {
			previousDeclaration.next = node.start;

			if ( node.type !== 'EmptyStatement' ) {
				previousDeclaration = null;
			}
		}

		if ( node.type === 'ImportDeclaration' ) {
			declaration = processImport( node );
			imports.push( declaration );
		}

		else if ( node.type === 'ExportDeclaration' ) {
			declaration = processExport( node, source );
			exports.push( declaration );

			if ( declaration.default ) {
				if ( mod.defaultExport ) {
					throw new Error( 'Duplicate default exports' );
				}
				mod.defaultExport = declaration;
			}

			if ( node.source ) {
				// it's both an import and an export, e.g.
				// `export { foo } from './bar';
				passthrough = processImport( node, true );
				imports.push( passthrough );

				declaration.passthrough = passthrough;
			}
		}

		if ( declaration ) {
			previousDeclaration = declaration;
		}
	});

	// catch any trailing semicolons
	if ( previousDeclaration ) {
		previousDeclaration.next = source.length;
		previousDeclaration.isFinal = true;
	}
}

function processImport ( node, passthrough ) {
	var result = {
		node: node,
		start: node.start,
		end: node.end,
		passthrough: !!passthrough,

		path: node.source.value,
		specifiers: node.specifiers.map( s => {
			var id;

			if ( s.type === 'ImportBatchSpecifier' ) {
				return {
					batch: true,
					name: s.name.name
				};
			}

			id = s.id.name;

			return {
				default: !!s.default,
				name: s.default ? 'default' : id,
				as: s.name ? s.name.name : id
			};
		})
	};

	// TODO have different types of imports - batch, default, named

	if ( result.specifiers.length === 1 && result.specifiers[0].default ) {
		result.default = true;
		result.name = result.specifiers[0].as;
	}

	return result;
}

function processExport ( node, source ) {
	var result, d;

	result = {
		node: node,
		start: node.start,
		end: node.end
	};

	if ( d = node.declaration ) {
		result.value = source.slice( d.start, d.end );
		result.valueStart = d.start;

		// Case 1: `export var foo = 'bar'`
		if ( d.type === 'VariableDeclaration' ) {
			result.declaration = true; // TODO remove in favour of result.type
			result.type = 'varDeclaration';
			result.name = d.declarations[0].id.name;
		}

		// Case 2: `export function foo () {...}`
		else if ( d.type === 'FunctionDeclaration' ) {
			result.declaration = true; // TODO remove in favour of result.type
			result.type = 'namedFunction';
			result.default = !!node.default;
			result.name = d.id.name;
		}

		else if ( d.type === 'FunctionExpression' ) {
			result.declaration = true; // TODO remove in favour of result.type
			result.default = true;

			// Case 3: `export default function foo () {...}`
			if ( d.id ) {
				result.type = 'namedFunction';
				result.name = d.id.name;
			}

			// Case 4: `export default function () {...}`
			else {
				result.type = 'anonFunction';
			}
		}

		// Case 5: `export default 1 + 2`
		else {
			result.type = 'expression';
			result.default = true;
			result.name = 'default';
		}
	}

	// Case 6: `export { foo, bar };`
	else {
		result.type = 'named';
		result.specifiers = node.specifiers.map( s => ({ name: s.id.name }) ) // TODO as?
	}

	return result;
}

function getDeclarationName ( declaration ) {
	if ( declaration.type === 'VariableDeclaration' ) {
		return declaration.declarations[0].id.name;
	}

	if ( declaration.type === 'FunctionDeclaration' ) {
		return declaration.id.name;
	}
}
