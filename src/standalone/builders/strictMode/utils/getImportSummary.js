export default function getImportSummary ( mod ) {
	var importPaths = [], importNames = [];

	mod.imports.forEach( ( x, i ) => {
		importPaths[i] = x.path;

		if ( x.specifiers.length ) { // don't add empty imports
			importNames[i] = mod.getName( x );
		}
	});

	return [ importPaths, importNames ];
}