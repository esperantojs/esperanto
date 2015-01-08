import packageResult from 'utils/packageResult';
import getExportBlock from './utils/getExportBlock';
import getExternalDefaults from './utils/getExternalDefaults';

export default function cjs ( bundle, body, options ) {
	var externalDefaults = getExternalDefaults( bundle );
	var entry = bundle.entryModule;

	var importBlock = bundle.externalModules.map( x => {
		var name = bundle.uniqueNames[ x.id ],
			statement = `var ${name} = require('${x.id}');`;

		if ( ~externalDefaults.indexOf( name ) ) {
			statement += `\nvar ${name}__default = ('default' in ${name} ? ${name}['default'] : ${name});`;
		}

		return statement;
	}).join( '\n' );

	if ( importBlock ) {
		body.prepend( importBlock + '\n\n' );
	}

	if ( entry.defaultExport ) {
		body.append( '\n\n' + getExportBlock( entry ) );
	}

	body.prepend("'use strict';\n\n");

	body.indent().prepend('(function () {\n\n').trimLines().append('\n\n}).call(global);');
	return packageResult( body, options, 'toCjs', true );
}
