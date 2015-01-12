import hasOwnProp from 'utils/hasOwnProp';
import { default as sanitize, splitPath } from 'utils/sanitize';

export default function getModuleNameHelper ( userFn, usedNames = {} ) {
	var nameById = {}, getModuleName;

	getModuleName = x => {
		var moduleId, parts, i, prefix = '', name, candidate;

		moduleId = x.path;

		// use existing value
		if ( hasOwnProp.call( nameById, moduleId ) ) {
			return nameById[ moduleId ];
		}

		// if user supplied a function, defer to it
		if ( userFn && ( name = userFn( moduleId ) ) ) {
			name = sanitize( name );

			if ( hasOwnProp.call( usedNames, name ) ) {
				// TODO write a test for this
				throw new Error( 'Naming collision: module ' + moduleId + ' cannot be called ' + name );
			}
		}

		else if ( x.isDefault || x.isBatch ) {
			name = x.name;
		}

		else {
			parts = splitPath( moduleId );
			i = parts.length;

			do {
				while ( i-- ) {
					candidate = prefix + sanitize( parts.slice( i ).join( '__' ) );

					if ( !hasOwnProp.call( usedNames, candidate ) ) {
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
