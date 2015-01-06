import packageResult from 'utils/packageResult';
import getExportBlock from './utils/getExportBlock';
import getExternalDefaults from './utils/getExternalDefaults';

export default function cjs ( bundle, body, options ) {
	var externalDefaults = getExternalDefaults( bundle ),
		importBlock,
		entry = bundle.entryModule,
		intro,
		indentStr;

	indentStr = body.getIndentString();

	importBlock = bundle.externalModules.map( x => {
		var name = bundle.uniqueNames[ x.id ],
			statement = `${indentStr}var ${name} = require('${x.id}');`;

		if ( ~externalDefaults.indexOf( name ) ) {
			statement += `\n${indentStr}var ${name}__default = ('default' in ${name} ? ${name}['default'] : ${name});`;
		}

		return statement;
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
