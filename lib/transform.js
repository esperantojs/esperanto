var acorn = require('acorn');
var __export;

__export = function ( source, options, isAmd ) {
	var ast,
		body,
		node,
		nextNode,
		imports = [],
		hasExports,
		replaced = '',
		alreadyReturned,
		i, len,
		code,
		SKIP = {};

	source = source.trim();

	ast = acorn.parse( source, {
		ecmaVersion: 6,
		locations: true
	});
	body = ast.body;

	replaced = source.slice( 0, body[0] ? body[0].start : 0 );

	len = body.length;
	for ( i = 0; i < len; i += 1 ) {
		node = body[i];
		nextNode = body[i+1];

		if ( isImportDeclaration( node ) || isExportDeclaration( node ) ) {
			code = replace( node, i );

			if ( code === SKIP ) {
				// In defaultOnly mode, we don't need to bother replacing
				// `import foo from 'foo'` - we just name the import foo
				// in the first place
				while ( nextNode && nextNode.type === 'EmptyStatement' ) {
					nextNode = body[ i++ ];
				}
			} else {
				replaced += code + source.slice( node.end, nextNode ? nextNode.start : source.length );;
			}
		}

		else {
			replaced += source.slice( node.start, nextNode ? nextNode.start : source.length );
		}
	}

	return {
		imports: imports,
		hasExports: hasExports,
		body: replaced,
		alreadyReturned: alreadyReturned
	};


	function replace ( node, nodeIndex ) {
		if ( isImportDeclaration( node ) ) {
			return replaceImport( node, nodeIndex );
		}

		return replaceExport( node, nodeIndex );
	}

	function replaceImport ( node ) {
		var _import, result = [], indent, specifier0;

		indent = getIndent( node.start, source );

		// empty imports, e.g. `import 'polyfills'`
		specifier0 = node.specifiers[0];
		if ( !specifier0 ) {
			imports.push({
				path: node.source.value,
				name: '__imports_' + imports.length,
				empty: true
			});

			return SKIP;
		}

		// batch imports, e.g. `import * as fs from 'fs';`
		if ( specifier0 && specifier0.type === 'ImportBatchSpecifier' ) {
			// this is (as far as AMD/CJS are concerned) functionally
			// equivalent to `import fs from 'fs'`
			imports.push({
				path: node.source.value,
				name: specifier0.name.name
			});

			return SKIP;
		}

		if ( options.defaultOnly && node.specifiers.length === 1 ) {
			// This is only a first pass - mixed imports (`import asap, {later} from 'asap'`)
			// are treated as default
			if ( node.kind !== 'default' ) {
				throw new Error( 'A named import was used in defaultOnly mode' );
			}

			imports.push({
				path: node.source.value,
				name: node.specifiers[0].id.name
			});

			return SKIP;
		}

		_import = {
			path: node.source.value,
			name: '__imports_' + imports.length
		};

		imports.push( _import );

		node.specifiers.forEach( function ( specifier ) {
			var declaration, id, name;

			if ( options.defaultOnly && !specifier.default ) {
				throw new Error( 'A named import was used in defaultOnly mode' );
			}

			id = specifier.id.name;

			if ( options.defaultOnly ) {
				declaration = 'var ' + id + ' = ' + _import.name;
			} else {
				name = ( specifier.name && specifier.name.name ) || id;
				declaration = 'var ' + name + ' = ' + _import.name + '.' + ( specifier.default ? 'default' : id );
			}

			result.push( declaration );
		});

		return result.join( ';\n' + indent );
	}

	function replaceExport ( node, nodeIndex ) {
		var indent, declarations = [], declaration = '', name, value;

		hasExports = true;

		indent = getIndent( node.start, source );

		if ( node.declaration ) {
			value = source.slice( node.declaration.start, node.declaration.end );

			// Special case - `export var foo = 'bar'`
			if ( name = getDeclarationName( node.declaration ) ) {
				if ( options.defaultOnly ) {
					throw new Error( 'A named export was used in defaultOnly mode' );
				}

				declaration = value + '\n' + indent;
				declaration += 'exports.' + name + ' = ' + name;
			}

			else if ( options.defaultOnly ) {
				// If this is the final node, we can just return from here
				if ( nodeIndex === body.length - 1 ) {
					declaration += ( isAmd ? 'return ' : 'module.exports = ' ) + value;
					alreadyReturned = true;
				} else {
					declaration += '__export = ' + value;
				}
			} else {
				declaration += 'exports.default = ' + value;
			}

			declarations.push( declaration + ';' );
		}

		else {
			if ( options.defaultOnly ) {
				throw new Error( 'A named export was used in defaultOnly mode' );
			}

			node.specifiers.forEach( function ( specifier ) {
				var name = specifier.id.name;
				declarations.push( 'exports.' + name + ' = ' + name );
			});
		}

		return declarations.join( ';\n' + indent );
	}
};

function isImportDeclaration ( node ) {
	return node.type === 'ImportDeclaration';
}

function isExportDeclaration ( node ) {
	return node.type === 'ExportDeclaration';
}

function getDeclarationName ( declaration ) {
	if ( declaration.type === 'VariableDeclaration' ) {
		return declaration.declarations[0].id.name;
	}

	if ( declaration.type === 'FunctionDeclaration' ) {
		return declaration.id.name;
	}
}

function getIndent ( index, source ) {
	var indent = '', char;

	index -= 1;
	while ( ( char = source.charAt( index ) ) && /[ \t]/.test( char ) ) {
		indent = char + indent;
		index -= 1;
	}

	if ( char === '\n' ) {
		return indent;
	}

	return '';
}
module.exports = __export;