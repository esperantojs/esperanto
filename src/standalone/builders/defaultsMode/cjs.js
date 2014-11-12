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
		if ( isFunctionDeclaration( exportDeclaration ) ) {
			// special case - we have a situation like
			//
			//     export default function foo () {...}
			//
			// which needs to be rewritten
			//
			//     function foo () {...}
			//     export default foo
			body.remove( exportDeclaration.start, exportDeclaration.valueStart );
			body.replace( exportDeclaration.end, exportDeclaration.end, `\nmodule.exports = ${exportDeclaration.node.declaration.id.name};` );
		} else {
			body.replace( exportDeclaration.start, exportDeclaration.end, `module.exports = ${exportDeclaration.value};` );
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
