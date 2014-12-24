export default function resolveExports ( bundle ) {
	var bundleExports = {};

	bundle.entryModule.exports.forEach( x => {
		if ( !x.specifiers ) {
			return;
		}

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

			if ( !bundleExports[ moduleId ] ) {
				bundleExports[ moduleId ] = {};
			}

			bundleExports[ moduleId ][ name ] = s.name;
		});
	});

	return bundleExports;
}