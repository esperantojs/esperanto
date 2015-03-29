import hasOwnProp from 'utils/hasOwnProp';

export default function resolveChains ( modules, moduleLookup ) {
	var chains = {};

	// First pass - resolving intra-module chains
	modules.forEach( mod => {
		var origin = {};

		mod.imports.forEach( x => {
			x.specifiers.forEach( s => {
				if ( s.isBatch ) {
					// if this is an internal module, we need to tell that module that
					// it needs to export an object full of getters
					if ( hasOwnProp.call( moduleLookup, x.id ) ) {
						moduleLookup[ x.id ]._exportsNamespace = true;
					}

					return; // TODO can batch imports be chained?
				}

				origin[ s.as ] = `${x.id}@${s.name}`;
			});
		});

		mod.exports.forEach( x => {
			if ( !x.specifiers ) return;

			x.specifiers.forEach( s => {
				if ( hasOwnProp.call( origin, s.name ) ) {
					chains[ `${mod.id}@${s.name}` ] = origin[ s.name ];
				}
			});
		});
	});

	return chains;
}
