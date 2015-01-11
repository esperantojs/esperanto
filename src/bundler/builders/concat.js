import packageResult from 'utils/packageResult';

export default function concat ( bundle, options ) {
	var body;

	// This bundle must be self-contained - no imports or exports
	if ( bundle.externalModules.length || bundle.entryModule.exports.length ) {
		throw new Error( 'bundle.concat() can only be used with bundles that have no imports/exports' );
	}

	body = bundle.body.clone()
		.trimLines()
		.indent()
		.prepend( `(function () { 'use strict';\n\n` )
		.append( '\n\n})();' );

	return packageResult( body, options, 'toString', true );
}