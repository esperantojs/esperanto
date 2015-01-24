import hasOwnProp from 'utils/hasOwnProp';

export default function getImportSummary ( mod ) {
	var importPaths = [], importNames = [], seen = {};

	mod.imports.forEach( x => {
		if ( !hasOwnProp.call( seen, x.path ) ) {
			importPaths.push( x.path );

			if ( x.specifiers.length ) { // don't add empty imports
				importNames.push( mod.getName( x ) );
			}

			seen[ x.path ] = true;
		}
	});

	return [ importPaths, importNames ];
}