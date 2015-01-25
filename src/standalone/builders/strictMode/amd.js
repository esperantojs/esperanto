import template from 'utils/template';
import packageResult from 'utils/packageResult';
import { resolveAgainst } from 'utils/resolveId';
import transformBody from './utils/transformBody';
import getImportSummary from './utils/getImportSummary';
import { quote } from 'utils/mappers';
import getExportObjectName from 'utils/getExportObjectName';

var introTemplate;

introTemplate = template( 'define(<%= amdName %><%= paths %>function (<%= names %>) {\n\n\t\'use strict\';\n\n' );

export default function amd ( mod, body, options ) {
	var importPaths,
		importNames,
		intro;

	[ importPaths, importNames ] = getImportSummary( mod );

	var exportObject = getExportObjectName( mod );

	if ( mod.exports.length ) {
		importPaths.unshift( 'exports' );
		importNames.unshift( exportObject );
	}

	intro = introTemplate({
		amdName: options.amdName ? `'${options.amdName}', ` : '',
		paths: importPaths.length ? '[' + ( options.absolutePaths ? importPaths.map( resolveAgainst( options.amdName ) ) : importPaths ).map( quote ).join( ', ' ) + '], ' : '',
		names: importNames.join( ', ' )
	}).replace( /\t/g, body.getIndentString() );

	transformBody( mod, body, {
		intro: intro,
		outro: '\n\n});',
		exportObject: exportObject,
	});

	return packageResult( body, options, 'toAmd' );
}
