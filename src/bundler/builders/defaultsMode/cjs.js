export default function cjs ( bundle, body ) {
	var importBlock,
		entry = bundle.entryModule,
		x,
		exportStatement,
		intro;

	importBlock = bundle.externalModules.map( x => {
		var name = bundle.uniqueNames[ x.id ];
		return body.indentStr + `var ${name}__default = require('${x.id}');`;
	}).join( '\n' );

	if ( importBlock ) {
		body.prepend( importBlock + '\n\n' );
	}

	if ( x = entry.exports[0] ) {
		exportStatement = body.indentStr + 'module.exports = ' + bundle.uniqueNames[ bundle.entry ] + '__default;';
		body.append( '\n\n' + exportStatement );
	}

	intro = '(function () {\n\n' + body.indentStr + "'use strict';\n\n";

	body.prepend( intro ).trim().append( '\n\n}).call(global);' );
	return body.toString();
}
