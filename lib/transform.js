var acorn = require( 'acorn' );

module.exports = function ( source, options, isAmd ) {
	var ast,
		body,
		numImports,
		exportCount = 0,
		importDeclarations,
		exportDeclarations,
		imports = [],
		exports = [],
		replacements = [],
		replacement,
		index,
		replaced = '',
		lineStarts = [],
		totalChars,
		alreadyReturned,
		i, len;

	ast = acorn.parse( source.trim(), {
		ecmaVersion: 6,
		locations: true
	});
	body = ast.body;

	numImports = body.filter( isImportDeclaration ).length;
	numExports = body.filter( isExportDeclaration ).length;

	len = body.length;
	for ( i = 0; i < len; i += 1 ) {
		node = body[i];

		if ( isImportDeclaration( node ) || isExportDeclaration( node ) ) {
			replacements.push({
				start: node.start,
				end: node.end,
				code: replace( node, i )
			});
		}
	}

	index = 0;
	while ( replacement = replacements.shift() ) {
		replaced += source.substr( index, replacement.start ) + replacement.code;
		index = replacement.end;

		if ( !replacements.length ) {
			replaced += source.substring( replacement.end );
		}
	}



	return {
		imports: imports,
		exports: exports,
		body: replaced,
		alreadyReturned: alreadyReturned
	};


	function replace ( node, nodeIndex ) {
		if ( isImportDeclaration( node ) ) {
			return replaceImport( node );
		}

		return replaceExport( node, nodeIndex );
	}

	function replaceImport ( node ) {
		var importPath, index, ast, replacements = [];

		indent = getIndent( node.start, source );

		if ( options.defaultOnly && node.kind !== 'default' ) {
			throw new Error( 'A named import was used in defaultOnly mode' );
		}

		importPath = node.source.value;
		index = numImports - ( imports.push( importPath ) );

		node.specifiers.forEach( function ( specifier ) {
			var init, declaration, name = specifier.id.name;

			declaration = 'var ' + name + ' = __imports_' + index;

			if ( !options.defaultOnly ) {
				declaration += '.' + ( node.kind === 'default' ? 'default' : name );
			}

			replacements.push( declaration );
		});

		return replacements.join( ';\n' + indent );
	}

	function replaceExport ( node, nodeIndex ) {
		var indent, index, declarations = [], declaration, value;

		indent = getIndent( node.start, source );
		index = numExports - exportCount++;

		if ( node.declaration ) {
			value = source.substr( node.declaration.start, node.declaration.end );


			if ( options.defaultOnly ) {
				// If this is the final node, we can just return from here
				if ( nodeIndex === body.length - 1 ) {
					declaration = ( isAmd ? 'return ' : 'module.exports = ' ) + value;
					alreadyReturned = true;
				} else {
					declaration = '__export = ' + value;
				}
			} else {
				declaration = 'exports.default = ' + value;
			}

			if ( node.declaration.type === 'FunctionExpression' ) {
				// If the function expression was written correctly -
				// without a semicolon - we need to add one
				declaration = fixFunctionExpression( declaration );
			}

			declarations.push( declaration );
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

function fixFunctionExpression ( declaration ) {
	var match, trailingWhitespace;

	match = /\s+/.exec( declaration );
	trailingWhitespace = match ? match[0] : '';

	declaration = declaration.slice( 0, -trailingWhitespace.length );

	if ( declaration.slice( -1 ) !== ';' ) {
		declaration += ';'
	}

	return declaration + trailingWhitespace;
}
