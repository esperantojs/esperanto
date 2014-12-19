import template from '../../../utils/template';
import getExportBlock from './utils/getExportBlock';
import packageResult from '../../../utils/packageResult';

var introTemplate;

export default function amd ( bundle, body, options ) {
	var defaultsBlock,
		entry = bundle.entryModule,
		exportBlock,
		externalModules = bundle.externalModules,
		importPaths,
		importNames,
		intro,
		indentStr;

	indentStr = body.getIndentString();

	defaultsBlock = externalModules.map( x => {
		var name = bundle.uniqueNames[ x.id ];
		return indentStr + `var ${name}__default = ('default' in ${name} ? ${name}['default'] : ${name});`;
	}).join( '\n' );

	if ( defaultsBlock ) {
		body.prepend( defaultsBlock + '\n\n' );
	}

	if ( entry.exports.length ) {
		importPaths = [ 'exports' ].concat( externalModules.map( getPath ) );
		importNames = [ 'exports' ].concat( externalModules.map( m => bundle.uniqueNames[ m.id ] ) );

		exportBlock = getExportBlock( bundle, entry, indentStr );
		body.append( '\n\n' + exportBlock );
	} else {
		importPaths = externalModules.map( getPath );
		importNames = externalModules.map( m => bundle.uniqueNames[ m.id ] );
	}

	intro = introTemplate({
		amdDeps: importPaths.length ? '[' + importPaths.map( quote ).join( ', ' ) + '], ' : '',
		names: importNames.join( ', ' )
	}).replace( /\t/g, indentStr );

	body.prepend( intro ).trim().append( '\n\n});' );
	return packageResult( body, options, 'toAmd', true );
}

function quote ( str ) {
	return "'" + str + "'";
}

function getPath ( m ) { return m.id; }

introTemplate = template( 'define(<%= amdDeps %>function (<%= names %>) {\n\n\t\'use strict\';\n\n' );
