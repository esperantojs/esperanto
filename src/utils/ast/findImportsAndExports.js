/**
 * Inspects a module and discovers/categorises import & export declarations
 * @param {object} mod - the module object
 * @param {string} source - the module's original source code
 * @param {object} ast - the result of parsing `source` with acorn
 * @returns {array} - [ imports, exports ]
 */
export default function findImportsAndExports ( mod, source, ast ) {
	var imports = [], exports = [], previousDeclaration;

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

			if ( declaration.isDefault ) {
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

	return [ imports, exports ];
}

/**
 * Generates a representation of an import declaration
 * @param {object} node - the original AST node
 * @param {boolean} passthrough - `true` if this is an `export { foo } from 'bar'`-style declaration
 * @returns {object}
 */
function processImport ( node, passthrough ) {
	var x = {
		id: null, // used by bundler - filled in later
		node: node,
		start: node.start,
		end: node.end,
		passthrough: !!passthrough,

		path: node.source.value,
		specifiers: node.specifiers.map( s => {
			var id;

			if ( s.type === 'ImportBatchSpecifier' ) {
				return {
					isBatch: true,
					name: s.name.name,
					as: s.name.name
				};
			}

			id = s.id.name;

			return {
				isDefault: !!s.default,
				name: s.default ? 'default' : id,
				as: s.name ? s.name.name : id
			};
		})
	};

	// TODO have different types of imports - batch, default, named
	if ( x.specifiers.length === 0 ) {
		x.isEmpty = true;
	} else if ( x.specifiers.length === 1 ) {
		if ( x.specifiers[0].isDefault ) {
			x.isDefault = true;
			x.name = x.specifiers[0].as;
		}

		if ( x.specifiers[0].isBatch ) {
			x.isBatch = true;
			x.name = x.specifiers[0].name;
		}
	} else {
		x.isNamed = true;
	}

	return x;
}

/**
 * Generates a representation of an export declaration
 * @param {object} node - the original AST node
 * @param {string} source - the original source code
 * @returns {object}
 */
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
			result.hasDeclaration = true; // TODO remove in favour of result.type
			result.type = 'varDeclaration';
			result.name = d.declarations[0].id.name;
		}

		// Case 2: `export function foo () {...}`
		else if ( d.type === 'FunctionDeclaration' ) {
			result.hasDeclaration = true; // TODO remove in favour of result.type
			result.type = 'namedFunction';
			result.isDefault = !!node.default;
			result.name = d.id.name;
		}

		else if ( d.type === 'FunctionExpression' ) {
			result.hasDeclaration = true; // TODO remove in favour of result.type
			result.isDefault = true;

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

		// Case 5: `export class Foo {...}`
		else if ( d.type === 'ClassDeclaration' ) {
			result.hasDeclaration = true; // TODO remove in favour of result.type
			result.type = 'namedClass';
			result.isDefault = !!node.default;
			result.name = d.id.name;
		}

		else if ( d.type === 'ClassExpression' ) {
			result.hasDeclaration = true; // TODO remove in favour of result.type
			result.isDefault = true;

			// Case 6: `export default class Foo {...}`
			if ( d.id ) {
				result.type = 'namedClass';
				result.name = d.id.name;
			}

			// Case 7: `export default class {...}`
			else {
				result.type = 'anonClass';
			}
		}

		// Case 8: `export default 1 + 2`
		else {
			result.type = 'expression';
			result.isDefault = true;
			result.name = 'default';
		}
	}

	// Case 9: `export { foo, bar };`
	else {
		result.type = 'named';
		result.specifiers = node.specifiers.map( s => ({ name: s.id.name }) ); // TODO as?
	}

	return result;
}