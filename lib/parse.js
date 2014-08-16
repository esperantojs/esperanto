var recast = require( 'recast' );

module.exports = function ( source, options ) {
	var ast, body, numImports, exportCount = 0, importDeclarations, exportDeclarations, imports = [], exports = [];

	ast = recast.parse( source.trim() );
	body = ast.program.body;

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
			var declaration = 'var ' + specifier.id.name + ' = __imports_' + index;

			if ( !options.defaultOnly ) {
				declaration += '.' + ( node.kind === 'default' ? 'default' : specifier.id.name );
			}

			varDeclarations.push( declaration );
		});

		ast = recast.parse( varDeclarations.join( '\n' ) );
		return ast.program.body;
	}

	function replaceExport ( node, nodeIndex ) {
		var index, declarations = [], ast;

		index = numExports - exportCount++;

		if ( node.declaration ) {
			declarations.push( ( options.defaultOnly ? '__export' : 'exports.default' ) + ' = ' + recast.print( body.splice( nodeIndex + 1, 1 )[0] ).code );
		}

		else {
			if ( options.defaultOnly ) {
				throw new Error( 'A named export was used in defaultOnly mode' );
			}

			node.specifiers.forEach( function ( specifier ) {
				declarations.push( 'exports.' + specifier.id.name + ' = ' + specifier.id.name + ';' );
			});
		}

		ast = recast.parse( declarations.join( '\n' ) );
		return ast.program.body;
	}
};

function isImportDeclaration ( node ) {
	return node.type === 'ImportDeclaration';
}

function isExportDeclaration ( node ) {
	return node.type === 'ExportDeclaration';
}
