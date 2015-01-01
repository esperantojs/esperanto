import packageResult from '../../../utils/packageResult';

export default function cjs ( bundle, body, options ) {
	var importBlock,
		entry = bundle.entryModule,
		x,
		exportStatement,
		intro,
		indentStr;

	indentStr = body.getIndentString();

	importBlock = bundle.externalModules.map( x => {
		var name = bundle.uniqueNames[ x.id ];
		return indentStr + `var ${name}__default = require('${x.id}');`;
	}).join( '\n' );

	if ( importBlock ) {
		body.prepend( importBlock + '\n\n' );
	}

	if ( x = entry.exports[0] ) {
		exportStatement = indentStr + `module.exports = ${bundle.identifierReplacements[ bundle.entry ].default.name};`;
		body.append( '\n\n' + exportStatement );
	}

	intro = '(function () {\n\n' + indentStr + "'use strict';\n\n";

	body.prepend( intro ).trim().append( '\n\n}).call(global);' );
	return packageResult( body, options, 'toCjs', true );
}
