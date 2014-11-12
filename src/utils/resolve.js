export default function resolve ( importPath, importerPath ) {
	var resolved, importerParts, importParts;

	if ( importPath[0] !== '.' ) {
		resolved = importPath;
	} else {
		importerParts = importerPath.split( '/' );
		importParts = importPath.split( '/' );

		importerParts.pop(); // get dirname
		while ( importParts[0] === '..' ) {
			importParts.shift();
			importerParts.pop();
		}

		while ( importParts[0] === '.' ) {
			importParts.shift();
		}

		resolved = importerParts.concat( importParts ).join( '/' );
	}

	return resolved.replace( /\.js$/, '' );
}