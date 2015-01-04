/**
 * Reorders an array of imports so that empty imports (those with
   no specifier, e.g. `import 'polyfills'`) are at the end. That
   way they can be excluded from the factory function's arguments
 * @param {array} imports - the imports to reorder
 */
export default function reorderImports ( imports ) {
	var i = imports.length, x;

	while ( i-- ) {
		x = imports[i];

		if ( x.isEmpty ) {
			imports.splice( i, 1 );
			imports.push( x );
		}
	}
}