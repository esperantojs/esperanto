import packageResult from 'utils/packageResult';
import getExportBlock from './utils/getExportBlock';

export default function cjs ( bundle, body, options ) {
	var entry = bundle.entryModule;

	var importBlock = bundle.externalModules.map( x => {
		var statement = `var ${x.name} = require('${x.id}');`;

		if ( x.needsDefault ) {
			statement += '\n' +
				( x.needsNamed ? `var ${x.name}__default` : x.name ) +
				` = ('default' in ${x.name} ? ${x.name}['default'] : ${x.name});`;
		}

		return statement;
	}).join( '\n' );

	if ( importBlock ) {
		body.prepend( importBlock + '\n\n' );
	}

	if ( entry.defaultExport ) {
		body.append( '\n\n' + getExportBlock( entry ) );
	}

	body.prepend("'use strict';\n\n").trimLines();

	return packageResult( body, options, 'toCjs', true );
}
