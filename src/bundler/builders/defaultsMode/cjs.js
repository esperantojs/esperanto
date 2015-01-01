import packageResult from '../../../utils/packageResult';
import getExportName from './utils/getExportName';

export default function cjs ( bundle, body, options ) {
	var importBlock,
		x,
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

	if ( bundle.entryModule.defaultExport ) {
		body.append( `\n\n${indentStr}module.exports = ${getExportName(bundle)};` );
	}

	intro = '(function () {\n\n' + indentStr + "'use strict';\n\n";

	body.prepend( intro ).trim().append( '\n\n}).call(global);' );
	return packageResult( body, options, 'toCjs', true );
}
