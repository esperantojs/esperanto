export default function reorderImports ( imports ) {
	var i;

	// ensure empty imports are at the end
	i = imports.length;
	while ( i-- ) {
		if ( !imports[i].specifiers.length ) {
			imports.splice( imports.length - 1, 0, imports.splice( i, 1 )[0] );
		}
	}
}