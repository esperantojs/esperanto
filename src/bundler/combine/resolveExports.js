export default function resolveExports ( bundle ) {
	let bundleExports = {};

	bundle.entryModule.exports.forEach( x => {
		if ( x.specifiers ) {
			x.specifiers.forEach( s => {
				let hash = `${bundle.entryModule.id}@${s.name}`;

				while ( bundle.chains[ hash ] ) {
					hash = bundle.chains[ hash ];
				}

				let [ moduleId, name ] = hash.split( '@' );

				addExport( moduleId, name, s.name );
			});
		}

		else if ( !x.isDefault && x.name ) {
			addExport( bundle.entry, x.name, x.name );
		}
	});

	function addExport ( moduleId, name, as ) {
		if ( !bundleExports[ moduleId ] ) {
			bundleExports[ moduleId ] = {};
		}

		bundleExports[ moduleId ][ name ] = as;
	}

	return bundleExports;
}