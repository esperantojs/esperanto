import hasOwnProp from 'utils/hasOwnProp';
import resolve from 'utils/resolve';

export default function resolveChains ( modules, moduleLookup ) {
	var chains = {};

	// First pass - resolving intra-module chains
	modules.forEach( mod => {
		var origin = {};

		mod.imports.forEach( x => {
			x.specifiers.forEach( s => {
				var moduleId = resolve( x.path, mod.file );

				if ( s.batch ) {
					// if this is an internal module, we need to tell that module that
					// it needs to export an object full of getters
					if ( hasOwnProp.call( moduleLookup, moduleId ) ) {
						moduleLookup[ moduleId ]._exportsNamespace = true;
					}

					return; // TODO can batch imports be chained?
				}

				origin[ s.as ] = moduleId + '@' + s.name;
			});
		});

		mod.exports.forEach( x => {
			if ( !x.specifiers ) return;

			x.specifiers.forEach( s => {
				if ( hasOwnProp.call( origin, s.name ) ) {
					chains[ mod.id + '@' + s.name ] = origin[ s.name ];
				}
			});
		});
	});

	return chains;
}
