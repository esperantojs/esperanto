export default function resolveExports ( bundle ) {
	var bundleExports = {};

	bundle.entryModule.exports.forEach( x => {
		var name;

		if ( x.specifiers ) {
			x.specifiers.forEach( s => {
				var hash = bundle.entryModule.id + '@' + s.name,
					split,
					moduleId,
					name;

				while ( bundle.chains[ hash ] ) {
					hash = bundle.chains[ hash ];
				}

				split = hash.split( '@' );
				moduleId = split[0];
				name = split[1];

				addExport( moduleId, name, s.name );
			});
		}

		else if ( !x.isDefault && ( name = x.name ) ) {
			addExport( bundle.entry, name, name );
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