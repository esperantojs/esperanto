export default function gatherImports ( imports, externalModuleLookup, importedBindings, toRewrite, chains, uniqueNames, conflicts ) {
	var replacements = {};

	imports.forEach( x => {
		var external;

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

				if ( specifierName === 'default' ) {
					replacement = external || conflicts.hasOwnProperty( moduleName ) ?
						moduleName + '__default' :
						moduleName;
				} else if ( !external ) {
					replacement = conflicts.hasOwnProperty( specifierName ) ?
						moduleName + '__' + specifierName :
						specifierName;
				} else {
					replacement = moduleName + '.' + specifierName;
				}
			}

			importedBindings[ name ] = replacement;

			if ( !x.passthrough ) {
				toRewrite[ name ] = replacement;
			}
		});
	});

	return replacements;
}
