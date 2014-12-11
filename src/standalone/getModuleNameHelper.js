import sanitize from '../utils/sanitize';

export default function moduleNameHelper ( userFn, varNames ) {
	var nameById = {}, usedNames = {}, getModuleName;

	if ( varNames ) {
		varNames.forEach( n => usedNames[n] = true );
	}

	getModuleName = x => {
		var moduleId, parts, i, prefix = '', name, candidate, specifier;

		moduleId = x.path;

		// use existing value
		if ( name = nameById[ moduleId ] ) {
			return name;
		}

		// if user supplied a function, defer to it
		if ( userFn && ( name = userFn( moduleId ) ) ) {
			name = sanitize( name );

			if ( usedNames[ name ] ) {
				// TODO write a test for this
				throw new Error( 'Naming collision: module ' + moduleId + ' cannot be called ' + name );
			}
		}

		else if ( x.default ) {
			name = x.name;
		}

		else if ( ( specifier = x.specifiers[0] ) && specifier.batch ) {
			name = specifier.name;
		}

		else {
			parts = moduleId.split( '/' );
			i = parts.length;

			do {
				while ( i-- ) {
					candidate = prefix + sanitize( parts.slice( i ).join( '__' ) );

					if ( !usedNames[ candidate ] ) {
						name = candidate;
						break;
					}
				}

				prefix += '_';
			} while ( !name );
		}

		usedNames[ name ] = true;
		nameById[ moduleId ] = name;

		return name;
	};

	return getModuleName;
}
