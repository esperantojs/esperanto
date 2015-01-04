import packageResult from 'utils/packageResult';
import transformBody from './utils/transformBody';

var intro = '(function () {\n\n\t\'use strict\';\n\n';
var outro = '\n\n}).call(global);';

export default function cjs ( mod, body, options ) {
	var importBlock;

	// Create block of require statements
	importBlock = mod.imports.map( x => {
		var name, replacement;

		if ( x.isEmpty ) {
			replacement = `require('${x.path}');`;
		} else {
			name = mod.getName( x );
			replacement = `var ${name} = require('${x.path}');`;
		}

		return replacement;
	}).join( '\n' );

	transformBody( mod, body, {
		intro: intro.replace( /\t/g, body.indentStr ),
		header: importBlock,
		outro: outro
	});

	return packageResult( body, options, 'toCjs' );
}
