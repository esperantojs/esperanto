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

		function addName ( n ) {
			moduleIdentifiers[n] = {
				name: conflicts.hasOwnProperty( n ) ?
					prefix + '__' + n :
					n
			};
		}

		mod.ast._scope.names.forEach( addName );
		mod.ast._blockScope.names.forEach( addName );

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

					if ( specifierName === 'default' ) {
						replacement = moduleName + '__default';
					} else if ( !external ) {
						replacement = conflicts.hasOwnProperty( specifierName ) ?
							moduleName + '__' + specifierName :
							specifierName;
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

		moduleIdentifiers.default = {
			name: prefix + '__default'
		};
	});

	return identifiers;
}