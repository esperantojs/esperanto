export default function hasNamedImports ( mod ) {
	var i, x;

	i = mod.imports.length;
	while ( i-- ) {
		x = mod.imports[i];

		if ( !x.specifiers.length ) {
			continue; // ok
		}

		if ( x.specifiers.length > 1 ) {
			return true;
		}

		if ( !x.specifiers[0].default && !x.specifiers[0].batch ) {
			return true;
		}
	}
}
