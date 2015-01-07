import packageResult from 'utils/packageResult';

export default function cjs ( bundle, body, options ) {
	var importBlock = bundle.externalModules.map( x => {
		var name = bundle.uniqueNames[ x.id ];
		return `var ${name}__default = require('${x.id}');`;
	}).join( '\n' );

	if ( importBlock ) {
		body.prepend( importBlock + '\n\n' );
	}

	var defaultName = bundle.entryModule.identifierReplacements.default;
	if ( defaultName ) {
		body.append( `\n\nmodule.exports = ${defaultName};` );
	}

	body.prepend("'use strict';\n\n");

	body.indent().prepend('(function () {\n\n').append('\n\n}).call(global);');
	return packageResult( body, options, 'toCjs', true );
}
