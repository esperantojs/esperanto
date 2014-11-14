export default function cjs ( mod, body, options ) {
	var replacement, exportDeclaration;

	mod.imports.forEach( x => {
		var specifier, name;

		specifier = x.specifiers[0];

		if ( !specifier ) {
			// empty import
			replacement = `require('${x.path}')`;
		} else {
			name = specifier.batch ? specifier.name : specifier.as;
			replacement = `var ${name} = require('${x.path}')`;
		}

		body.replace( x.start, x.end, replacement );
	});

	exportDeclaration = mod.exports[0];

	if ( exportDeclaration ) {
		switch ( exportDeclaration.type ) {
			case 'namedFunction':
			body.remove( exportDeclaration.start, exportDeclaration.valueStart );
			body.replace( exportDeclaration.end, exportDeclaration.end, `\nmodule.exports = ${exportDeclaration.node.declaration.id.name};` );
			break;

			case 'anonFunction':
			case 'expression':
			body.replace( exportDeclaration.start, exportDeclaration.valueStart, 'module.exports = ' );
			break;

			default:
			throw new Error( 'Unexpected export type' );
		}
	}

	body.trim();

	if ( options.addUseStrict !== 'false' ) {
		body.prepend( "'use strict';\n\n" ).indent().prepend( '(function () {\n\n' ).append( '\n\n}).call(global);' );
	}

	return body.toString();
}

function isFunctionDeclaration ( x ) {
	return x.node.declaration && x.node.declaration.type === 'FunctionExpression';
}
