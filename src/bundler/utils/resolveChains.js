import hasOwnProp from 'utils/hasOwnProp';

/**
 * Discovers 'chains' within a bundle - e.g. `import { foo } from 'foo'`
   may be equivalent to `import { bar } from 'bar'`, if foo.js imports `bar`
   and re-exports it as `foo`. Where applicable, import/export specifiers
   are augmented with an `origin: { module, name }` property
 * @param {array} modules - the bundle's array of modules
 * @param {object} moduleLookup - modules indexed by their ID
 */
export default function resolveChains ( modules, moduleLookup ) {
	let chains = {};

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

				origin[ s.as ] = `${s.name}@${imported.id}`;
			});
		});

		mod.exports.forEach( x => {
			if ( !x.specifiers ) return;

			x.specifiers.forEach( s => {
				if ( hasOwnProp.call( origin, s.name ) ) {
					chains[ `${s.as}@${mod.id}` ] = origin[ s.name ];
				} else if ( s.as !== s.name ) {
					chains[ `${s.as}@${mod.id}` ] = `${s.name}@${mod.id}`;
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

				setOrigin( s, `${s.name}@${imported.id}`, chains, moduleLookup );
			});
		});

		mod.exports.forEach( x => {
			if ( !x.specifiers ) return;

			x.specifiers.forEach( s => {
				setOrigin( s, `${s.as}@${mod.id}`, chains, moduleLookup );
			});
		});
	});
}

function setOrigin ( specifier, hash, chains, moduleLookup ) {
	let isChained;

	while ( hasOwnProp.call( chains, hash ) ) {
		hash = chains[ hash ];
		isChained = true;
	}

	if ( isChained ) {
		const [ name, moduleId ] = hash.split( '@' );
		specifier.origin = { module: moduleLookup[ moduleId ], name };
	}
}
