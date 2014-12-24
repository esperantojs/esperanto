export default function gatherImports ( imports, externalModuleLookup, chains, uniqueNames ) {
	var importIdentifierReplacements = {};

	imports.forEach( x => {
		var external;

		if ( x.passthrough ) {
			return;
		}

		if ( externalModuleLookup.hasOwnProperty( x.path ) ) {
			external = true;
		}

		x.specifiers.forEach( s => {
			var moduleId, moduleName, specifierName, name, replacement, hash, isChained, separatorIndex;

			moduleId = x.id;

			if ( s.batch ) {
				name = s.name;
				replacement = uniqueNames[ moduleId ];
			} else {
				name = s.as;
				specifierName = s.name;

				// If this is a chained import, get the origin
				hash = moduleId + '@' + specifierName;
				while ( chains.hasOwnProperty( hash ) ) {
					hash = chains[ hash ];
					isChained = true;
				}

				if ( isChained ) {
					separatorIndex = hash.indexOf( '@' );
					moduleId = hash.substr( 0, separatorIndex );
					specifierName = hash.substring( separatorIndex + 1 );
				}

				moduleName = uniqueNames[ moduleId ];

				if ( !external || specifierName === 'default' ) {
					replacement = moduleName + '__' + specifierName;
				} else {
					replacement = moduleName + '.' + specifierName;
				}
			}

			importIdentifierReplacements[ name ] = replacement;
		});
	});

	return importIdentifierReplacements;
}
