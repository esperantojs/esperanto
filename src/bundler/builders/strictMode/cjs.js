import getExportBlock from './utils/getExportBlock';

export default function cjs ( bundle, body ) {
	var importBlock,
		entry = bundle.entryModule,
		exportBlock,
		intro;

	importBlock = bundle.externalModules.map( x => {
		var name = bundle.uniqueNames[ x.id ];

		return body.indentStr + `var ${name} = require('${x.id}');\n` +
		       body.indentStr + `var ${name}__default = ('default' in ${name} ? ${name}.default : ${name});`;
	}).join( '\n' );

	if ( importBlock ) {
		body.prepend( importBlock + '\n\n' );
	}

	if ( entry.exports.length ) {
		exportBlock = getExportBlock( bundle, entry, body.indentStr );
		body.append( '\n\n' + exportBlock );
	}

	intro = '(function () {\n\n' + body.indentStr + "'use strict';\n\n";

	body.prepend( intro ).trim().append( '\n\n}).call(global);' );
	return body.toString();
}
