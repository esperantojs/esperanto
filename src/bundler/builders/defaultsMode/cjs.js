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
		var name = bundle.uniqueNames[ bundle.entry ];
		if ( bundle.conflicts.hasOwnProperty( name ) ) {
			name += '__default';
		}
		exportStatement = indentStr + 'module.exports = ' + name + ';';
		body.append( '\n\n' + exportStatement );
	}

	intro = '(function () {\n\n' + indentStr + "'use strict';\n\n";

	body.prepend( intro ).trim().append( '\n\n}).call(global);' );
	return packageResult( body, options, 'toCjs', true );
}
