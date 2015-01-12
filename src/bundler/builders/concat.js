import packageResult from 'utils/packageResult';

export default function concat ( bundle, options ) {
	var body, intro, outro, indent;

	// This bundle must be self-contained - no imports or exports
	if ( bundle.externalModules.length || bundle.entryModule.exports.length ) {
		throw new Error( 'bundle.concat() can only be used with bundles that have no imports/exports' );
	}

	body = bundle.body.clone();

	// TODO test these options
	intro = 'intro' in options ? options.intro : `(function () { 'use strict';\n\n`;
	outro = 'outro' in options ? options.outro : '\n\n})();';

	if ( !( 'indent' in options ) || options.indent === true ) {
		indent = body.getIndentString();
	} else {
		indent = options.indent || '';
	}

	body.trimLines().indent( indent ).prepend( intro ).append( outro );

	return packageResult( body, options, 'toString', true );
}