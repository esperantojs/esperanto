var recast = require( 'recast' );

module.exports = function ( source ) {
	var ast, body, numImports, importDeclarations, exportDeclarations, imports = [], exports = [];

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

		source = node.source.value;
		index = numImports - ( imports.push( source ) );

		node.specifiers.forEach( function ( specifier ) {
			varDeclarations.push( 'var ' + specifier.id.name + ' = __imports_' + index + '.' + ( node.kind === 'default' ? 'default' : specifier.id.name) );
		});

		ast = recast.parse( varDeclarations.join( '\n' ) );
		return ast.program.body;
	}

	function replaceExport ( node, nodeIndex ) {
		var index, declarations = [], ast;

		index = numExports - ( exports.push( 'hmm' ) );

		if ( node.declaration ) {
			declarations.push( 'exports.default = ' + recast.print( body.splice( nodeIndex + 1, 1 )[0] ).code );
		}

		else {
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
