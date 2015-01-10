export default function populateExternalModuleImports ( bundle ) {
	bundle.modules.forEach( mod => {
		mod.imports.forEach( x => {
			var externalModule = bundle.externalModuleLookup[ x.id ];

			if ( !externalModule ) {
				return;
			}

			x.specifiers.forEach( s => {
				if ( s.isDefault ) {
					externalModule.needsDefault = true;
				} else {
					externalModule.needsNamed = true;
				}
			});
		});
	});
}