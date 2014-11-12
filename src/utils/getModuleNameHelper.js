import sanitize from './sanitize';

export default function moduleNameHelper ( userFn ) {
	var nameByPath = {}, usedNames = {}, getModuleName;

	getModuleName = moduleId => {
		var parts, i, name;

		// use existing value
		if ( name = nameByPath[ moduleId ] ) {
			return name;
		}

		// if user supplied a function, defer to it
		if ( userFn && ( name = userFn( moduleId ) ) ) {
			nameByPath[ moduleId ] = sanitize( name );
		}

		else {
			parts = moduleId.split( '/' );
			i = parts.length;

			while ( i-- ) {
				name = sanitize( parts.slice( i ).join( '__' ) );

				if ( !usedNames[ name ] ) {
					usedNames[ name ] = true;
					nameByPath[ moduleId ] = name;

					break;
				}
			}
		}

		return nameByPath[ moduleId ];
	};

	return getModuleName;
}
