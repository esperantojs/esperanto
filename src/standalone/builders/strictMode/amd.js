import template from 'utils/template';
import packageResult from 'utils/packageResult';
import reorderImports from 'utils/reorderImports';
import transformBody from './utils/transformBody';
import getImportSummary from './utils/getImportSummary';
import { quote } from 'utils/mappers';

var introTemplate;

introTemplate = template( 'define(<%= paths %>function (<%= names %>) {\n\n\t\'use strict\';\n\n' );

export default function amd ( mod, body, options ) {
	var importPaths,
		importNames,
		intro;

	// ensure empty imports are at the end
	reorderImports( mod.imports );

	[ importPaths, importNames ] = getImportSummary( mod );

	if ( mod.exports.length ) {
		importPaths.unshift( 'exports' );
		importNames.unshift( 'exports' );
	}

	intro = introTemplate({
		paths: importPaths.length ? '[' + importPaths.map( quote ).join( ', ' ) + '], ' : '',
		names: importNames.join( ', ' )
	}).replace( /\t/g, body.indentStr );

	transformBody( mod, body, {
		intro: intro,
		outro: '\n\n});'
	});

	return packageResult( body, options, 'toAmd' );
}
