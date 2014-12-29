import topLevelScopeConflicts from './topLevelScopeConflicts';

/**
 * Figures out which identifiers need to be rewritten within
 * a bundle to avoid conflicts
 * @param {object} bundle - the bundle
 * @returns {object}
 */
export default function getIdentifiers ( bundle ) {
	var conflicts, identifiers = {};

	// first, discover conflicts
	conflicts = topLevelScopeConflicts( bundle );

	bundle.modules.forEach( mod => {
		var prefix, moduleIdentifiers;

		prefix = bundle.uniqueNames[ mod.id ];

		identifiers[ mod.id ] = moduleIdentifiers = {};

		// All variables declared at the top level are given a prefix,
		// as an easy way to deconflict when two or more modules have the
		// same variable names. TODO deconflict more elegantly (see e.g.
		// https://github.com/Rich-Harris/esperanto/pull/24)
		mod.ast._scope.names.forEach( n => moduleIdentifiers[n] = {
			name: prefix + '__' + n
		});

		mod.ast._blockScope.names.forEach( n => moduleIdentifiers[n] = {
			name: prefix + '__' + n
		});

		mod.imports.forEach( x => {
			var external;

			if ( x.passthrough ) {
				return;
			}

			if ( bundle.externalModuleLookup.hasOwnProperty( x.id ) ) {
				external = true;
			}

			x.specifiers.forEach( s => {
				var moduleId, moduleName, specifierName, name, replacement, hash, isChained, separatorIndex;

				moduleId = x.id;

				if ( s.batch ) {
					name = s.name;
					replacement = bundle.uniqueNames[ moduleId ];
				} else {
					name = s.as;
					specifierName = s.name;

					// If this is a chained import, get the origin
					hash = moduleId + '@' + specifierName;
					while ( bundle.chains.hasOwnProperty( hash ) ) {
						hash = bundle.chains[ hash ];
						isChained = true;
					}

					if ( isChained ) {
						separatorIndex = hash.indexOf( '@' );
						moduleId = hash.substr( 0, separatorIndex );
						specifierName = hash.substring( separatorIndex + 1 );
					}

					moduleName = bundle.uniqueNames[ moduleId ];

					if ( !external || specifierName === 'default' ) {
						replacement = moduleName + '__' + specifierName;
					} else {
						replacement = moduleName + '.' + specifierName;
					}
				}

				moduleIdentifiers[ name ] = {
					name: replacement,
					readOnly: true
				};
			});
		});
	});

	return identifiers;
}