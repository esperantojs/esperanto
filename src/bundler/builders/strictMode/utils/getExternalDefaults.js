import hasOwnProp from 'utils/hasOwnProp';

export default function getExternalDefaults ( bundle ) {
	var externalDefaults = [];

	bundle.modules.forEach( mod => {
		mod.imports.forEach( x => {
			var name;

			if ( x.isDefault && hasOwnProp.call( bundle.externalModuleLookup, x.id ) ) {
				name = bundle.uniqueNames[ x.id ];

				if ( !~externalDefaults.indexOf( name ) ) {
					externalDefaults.push( name );
				}
			}
		});
	});

	return externalDefaults;
}