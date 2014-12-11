import sanitize from '../utils/sanitize';

export default function moduleNameHelper ( userFn ) {
	var nameById = {}, usedNames = {}, getModuleName;

	getModuleName = x => {
		var moduleId, parts, i, name, candidate, specifier;

		moduleId = x.path;

		// use existing value
		if ( name = nameById[ moduleId ] ) {
			return name;
		}

		// if user supplied a function, defer to it
		if ( userFn && ( name = userFn( moduleId ) ) ) {
			nameById[ moduleId ] = sanitize( name );
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

			while ( i-- ) {
				candidate = sanitize( parts.slice( i ).join( '__' ) );

				if ( !usedNames[ candidate ] ) {
					name = candidate;
					break;
				}
			}
		}

		usedNames[ name ] = true;
		nameById[ moduleId ] = name;

		return name;
	};

	return getModuleName;
}
