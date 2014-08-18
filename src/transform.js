import acorn from 'acorn';

export default function ( source, options, isAmd ) {
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

	replaced = '';

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
		var _import, result = [], indent;

		indent = getIndent( node.start, source );

		// batch imports, e.g. `import * as fs from 'fs';`
		if ( node.specifiers[0].type === 'ImportBatchSpecifier' ) {
			// this is (as far as AMD/CJS are concerned) functionally
			// equivalent to `import fs from 'fs'`
			imports.push({
				path: node.source.value,
				name: node.specifiers[0].name.name
			});

			return SKIP;
		}

		if ( options.defaultOnly ) {
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

			id = specifier.id.name;

			if ( options.defaultOnly ) {
				declaration = 'var ' + id + ' = ' + _import.name;
			} else {
				name = ( specifier.name && specifier.name.name ) || id;
				declaration = 'var ' + name + ' = ' + _import.name + '.' + ( node.kind === 'default' ? 'default' : id );
			}

			result.push( declaration );
		});

		return result.join( ';\n' + indent );
	}

	function replaceExport ( node, nodeIndex ) {
		var indent, declarations = [], declaration = '', value;

		hasExports = true;

		indent = getIndent( node.start, source );

		if ( node.declaration ) {
			value = source.slice( node.declaration.start, node.declaration.end );

			// Special case - `export var foo = 'bar'`
			if ( node.declaration.type === 'VariableDeclaration' ) {
				if ( options.defaultOnly ) {
					throw new Error( 'A named export was used in defaultOnly mode' );
				}

				declaration = value + '\n' + indent;
				value = node.declaration.declarations[0].id.name;
			}

			if ( options.defaultOnly ) {
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
}

function isImportDeclaration ( node ) {
	return node.type === 'ImportDeclaration';
}

function isExportDeclaration ( node ) {
	return node.type === 'ExportDeclaration';
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
