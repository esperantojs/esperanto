/**
 * Inspects a module and discovers/categorises import & export declarations
 * @param {object} ast - the result of parsing `source` with acorn
 * @param {string} source - the module's original source code
 * @returns {object} - { imports, exports, defaultExport }
 */
export default function findImportsAndExports ( ast, source ) {
	let imports = [];
	let exports = [];
	let defaultExport;
	let previousDeclaration;

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

		else if ( node.type === 'ExportDefaultDeclaration' ) {
			declaration = processDefaultExport( node, source );
			exports.push( declaration );

			if ( defaultExport ) {
				throw new Error( 'Duplicate default exports' );
			}
			defaultExport = declaration;
		}

		else if ( node.type === 'ExportNamedDeclaration' ) {
			declaration = processExport( node, source );
			exports.push( declaration );

			if ( node.source ) {
				// it's both an import and an export, e.g.
				// `export { foo } from './bar';
				passthrough = processImport( node, true );

				passthrough.specifiers.forEach( e => {
					// the import in `export { default } from 'foo';`
					// is a default import
					if ( e.name === 'default' ) {
						e.isDefault = true;
					}
				});

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

	return { imports, exports, defaultExport };
}

/**
 * Generates a representation of an import declaration
 * @param {object} node - the original AST node
 * @param {boolean} passthrough - `true` if this is an `export { foo } from 'bar'`-style declaration
 * @returns {object}
 */
function processImport ( node, passthrough ) {
	var x = {
		module: null, // used by bundler - filled in later
		node: node,
		start: node.start,
		end: node.end,
		passthrough: !!passthrough,

		path: node.source.value,
		specifiers: node.specifiers.map( s => {
			if ( s.type === 'ImportNamespaceSpecifier' ) {
				return {
					isBatch: true,
					name: s.local.name, // TODO is this line necessary?
					as: s.local.name,
					origin: null // filled in later by bundler
				};
			}

			if ( s.type === 'ImportDefaultSpecifier' ) {
				return {
					isDefault: true,
					name: 'default',
					as: s.local.name,
					origin: null
				};
			}

			return {
				name: ( !!passthrough ? s.exported : s.imported ).name,
				as: s.local.name,
				origin: null
			};
		})
	};

	// TODO have different types of imports - batch, default, named
	if ( x.specifiers.length === 0 ) {
		x.isEmpty = true;
	} else if ( x.specifiers.length === 1 && x.specifiers[0].isDefault ) {
		x.isDefault = true;
		x.as = x.specifiers[0].as;

	} else if ( x.specifiers.length === 1 && x.specifiers[0].isBatch ) {
		x.isBatch = true;
		x.as = x.specifiers[0].name;
	} else {
		x.isNamed = true;
	}

	return x;
}

function processDefaultExport ( node, source ) {
	const d = node.declaration;

	let result = {
		node,
		isDefault: true,
		start: node.start,
		end: node.end,
		value: source.slice( d.start, d.end ),
		valueStart: d.start,
		hasDeclaration: null,
		type: null,
		name: null
	};

	// possible declaration types:
	//   * FunctionExpression  - `export default function () {...}`
	//   * FunctionDeclaration - `export default function foo () {...}`
	//   * ClassExpression     - `export default class {...}`
	//   * ClassDeclaration    - `export default class Foo {...}`
	const match = /^(Function|Class)(Declaration)?/.exec( d.type );

	if ( match ) {
		result.hasDeclaration = true;
		result.type = ( match[2] ? 'named' : 'anon' ) + match[1];

		if ( match[2] ) {
			result.name = d.id.name;
		}
	}

	// if no match, we have an expression like `export default whatever`
	else {
		result.type = 'expression';
		result.name = 'default';
	}

	return result;
}

/**
 * Generates a representation of an export declaration
 * @param {object} node - the original AST node
 * @param {string} source - the original source code
 * @returns {object}
 */
function processExport ( node, source ) {
	let result = {
		node,
		start: node.start,
		end: node.end,
		value: null,
		valueStart: null,
		hasDeclaration: null,
		type: null,
		name: null,
		specifiers: null
	};

	const d = node.declaration;

	if ( d ) {
		result.hasDeclaration = true;
		result.value = source.slice( d.start, d.end );
		result.valueStart = d.start;

		// Case 1: `export var foo = 'bar'`
		if ( d.type === 'VariableDeclaration' ) {
			result.type = 'varDeclaration';
			result.name = d.declarations[0].id.name;
		}

		// Case 2: `export function foo () {...}`
		else if ( d.type === 'FunctionDeclaration' ) {
			result.type = 'namedFunction';
			result.name = d.id.name;
		}

		// Case 3: `export class Foo {...}`
		else if ( d.type === 'ClassDeclaration' ) {
			result.type = 'namedClass';
			result.name = d.id.name;
		}
	}

	// Case 9: `export { foo, bar };`
	else {
		result.type = 'named';
		result.specifiers = node.specifiers.map( s => {
			return {
				origin: null, // filled in later by bundler
				name: s.local.name,
				as: s.exported.name
			};
		});
	}

	return result;
}
