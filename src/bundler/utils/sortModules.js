import resolve from '../../utils/resolve';

export default function sortModules ( entry, moduleLookup ) {
	var seen = {},
		ordered = [];

	function visit ( mod ) {
		// ignore external modules, and modules we've
		// already included
		if ( !mod || seen[ mod.id ] ) {
			return;
		}

		seen[ mod.id ] = true;

		mod.imports.forEach( x => {
			var id = resolve( x.path, mod.file );
			visit( moduleLookup[ id ] );
		});

		ordered.push( mod );
	}

	visit( entry );

	return ordered;
}
