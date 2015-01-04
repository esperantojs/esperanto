import hasOwnProp from 'utils/hasOwnProp';

export default function sortModules ( entry, moduleLookup ) {
	var seen = {},
		ordered = [];

	function visit ( mod ) {
		// ignore external modules, and modules we've
		// already included
		if ( !mod || hasOwnProp.call( seen, mod.id ) ) {
			return;
		}

		seen[ mod.id ] = true;

		mod.imports.forEach( x => {
			visit( moduleLookup[ x.id ] );
		});

		ordered.push( mod );
	}

	visit( entry );

	return ordered;
}
