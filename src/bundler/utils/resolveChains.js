import hasOwnProp from 'utils/hasOwnProp';

export default function resolveChains ( modules, moduleLookup ) {
	var chains = {};

	// First pass - resolving intra-module chains
	modules.forEach( mod => {
		var origin = {};

		mod.imports.forEach( x => {
			const imported = x.module;

			x.specifiers.forEach( s => {
				if ( s.isBatch ) {
					// tell that module that it needs to export an object full of getters
					imported._exportsNamespace = true;
					return; // TODO can batch imports be chained?
				}

				origin[ s.as ] = `${imported.id}@${s.name}`;
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

	// Second pass - assigning origins to specifiers
	modules.forEach( mod => {
		mod.imports.forEach( x => {
			const imported = x.module;

			x.specifiers.forEach( s => {
				if ( s.isBatch ) {
					return; // TODO can batch imports be chained?
				}

				let hash = `${imported.id}@${s.name}`;
				let isChained;

				while ( hasOwnProp.call( chains, hash ) ) {
					hash = chains[ hash ];
					isChained = true;
				}

				if ( isChained ) {
					const [ moduleId, name ] = hash.split( '@' );
					s.origin = { module: moduleLookup[ moduleId ], name };
				}
			});
		});
	});

	return chains;
}
