import transformBody from './utils/transformBody';

var intro = '(function () {\n\n\t\'use strict\';\n\n';
var outro = '\n\n}).call(global);';

export default function cjs ( mod, body ) {
	var importBlock;

	// Create block of require statements
	importBlock = mod.imports.map( x => {
		var specifier, name, replacement;

		specifier = x.specifiers[0];

		if ( !specifier ) {
			// empty import
			replacement = `require('${x.path}');`;
		} else {
			name = specifier.batch ? specifier.name : mod.getName( x.path );
			replacement = `var ${name} = require('${x.path}');`;
		}

		return replacement;
	}).join( '\n' );

	transformBody( mod, body, {
		intro: intro.replace( /\t/g, body.indentStr ),
		header: importBlock,
		outro: outro
	});

	return body.toString();
}
