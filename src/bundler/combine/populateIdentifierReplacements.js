import hasOwnProp from 'utils/hasOwnProp';
import topLevelScopeConflicts from './topLevelScopeConflicts';

/**
 * Figures out which identifiers need to be rewritten within
   a bundle to avoid conflicts
 * @param {object} bundle - the bundle
 * @returns {object}
 */
export default function populateIdentifierReplacements ( bundle ) {
	// first, discover conflicts
	let conflicts = topLevelScopeConflicts( bundle );

	// then figure out what identifiers need to be created
	// for default exports
	bundle.modules.forEach( mod => {
		let x = mod.defaultExport;

		if ( x ) {
			let result;

			if ( x.hasDeclaration && x.name ) {
				result = hasOwnProp.call( conflicts, x.name ) || otherModulesDeclare( mod, x.name ) ?
					`${mod.name}__${x.name}` :
					x.name;
			} else {
				result = hasOwnProp.call( conflicts, mod.name ) || ( x.value !== mod.name && ~mod.ast._topLevelNames.indexOf( mod.name )) || otherModulesDeclare( mod, mod.name ) ?
					`${mod.name}__default` :
					mod.name;
			}

			mod.identifierReplacements.default = result;
		}
	});

	// then determine which existing identifiers
	// need to be replaced
	bundle.modules.forEach( mod => {
		let moduleIdentifiers = mod.identifierReplacements;

		mod.ast._topLevelNames.forEach( n => {
			moduleIdentifiers[n] = hasOwnProp.call( conflicts, n ) ?
				`${mod.name}__${n}` :
				n;
		});

		mod.imports.forEach( x => {
			var externalModule;

			if ( x.passthrough ) {
				return;
			}

			externalModule = hasOwnProp.call( bundle.externalModuleLookup, x.id ) && bundle.externalModuleLookup[ x.id ];

			x.specifiers.forEach( s => {
				var moduleId, mod, moduleName, specifierName, replacement, hash, isChained, separatorIndex;

				moduleId = x.id;

				if ( s.isBatch ) {
					replacement = ( bundle.moduleLookup[ moduleId ] || bundle.externalModuleLookup[ moduleId ] ).name;
				}

				else {
					specifierName = s.name;

					// If this is a chained import, get the origin
					hash = `${moduleId}@${specifierName}`;
					while ( hasOwnProp.call( bundle.chains, hash ) ) {
						hash = bundle.chains[ hash ];
						isChained = true;
					}

					if ( isChained ) {
						separatorIndex = hash.indexOf( '@' );
						moduleId = hash.substr( 0, separatorIndex );
						specifierName = hash.substring( separatorIndex + 1 );
					}

					mod = ( bundle.moduleLookup[ moduleId ] || bundle.externalModuleLookup[ moduleId ] );
					moduleName = mod && mod.name;

					if ( specifierName === 'default' ) {
						// if it's an external module, always use __default if the
						// bundle also uses named imports
						if ( !!externalModule ) {
							replacement = externalModule.needsNamed ? `${moduleName}__default` : moduleName;
						}

						// TODO We currently need to check for the existence of `mod`, because modules
						// can be skipped. Would be better to replace skipped modules with dummies
						// - see https://github.com/Rich-Harris/esperanto/issues/32
						else if ( mod ) {
							replacement = mod.identifierReplacements.default;
						}
					} else if ( !externalModule ) {
						replacement = hasOwnProp.call( conflicts, specifierName ) ?
							`${moduleName}__${specifierName}` :
							specifierName;
					} else {
						replacement = moduleName + '.' + specifierName;
					}
				}

				if ( replacement !== s.as ) {
					moduleIdentifiers[ s.as ] = replacement;
				}
			});
		});
	});

	function otherModulesDeclare ( mod, replacement ) {
		var i, otherMod;

		i = bundle.modules.length;
		while ( i-- ) {
			otherMod = bundle.modules[i];

			if ( mod === otherMod ) {
				continue;
			}

			if ( hasOwnProp.call( otherMod.ast._declared, replacement ) ) {
				return true;
			}
		}
	}
}
