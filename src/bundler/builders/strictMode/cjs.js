import getExportBlock from './utils/getExportBlock';
import packageResult from '../../../utils/packageResult';

export default function cjs ( bundle, body, options ) {
	var importBlock,
		entry = bundle.entryModule,
		intro,
		indentStr;

	indentStr = body.getIndentString();

	importBlock = bundle.externalModules.map( x => {
		var name = bundle.uniqueNames[ x.id ];

		return indentStr + `var ${name} = require('${x.id}');\n` +
		       indentStr + `var ${name}__default = ('default' in ${name} ? ${name}['default'] : ${name});`;
	}).join( '\n' );

	if ( importBlock ) {
		body.prepend( importBlock + '\n\n' );
	}

	if ( entry.defaultExport ) {
		body.append( '\n\n' + getExportBlock( entry, indentStr ) );
	}

	intro = '(function () {\n\n' + indentStr + "'use strict';\n\n";

	body.prepend( intro ).trim().append( '\n\n}).call(global);' );
	return packageResult( body, options, 'toCjs', true );
}
