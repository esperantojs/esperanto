import resolve from '../../utils/resolve';
import sanitize from '../../utils/sanitize';

// TODO use sensible names, inferring from defaults where poss
export default function getUniqueNames ( modules, userNames ) {
	var names = {}, used = {};

	// copy user-specified names
	if ( userNames ) {
		Object.keys( userNames ).forEach( n => {
			names[n] = userNames[n];
			used[ userNames[n] ] = true;
		});
	}

	// infer names from imports
	modules.forEach( mod => {
		mod.imports.forEach( x => {
			var id = resolve( x.path, mod.file );
			x.id = id;

			if ( x.default && !names.hasOwnProperty( id ) && !used.hasOwnProperty( x.name ) ) {
				names[ id ] = x.name;
				used[ x.name ] = true;
			}
		});
	});

	// for the rest, make names as compact as possible without
	// introducing conflicts
	modules.forEach( mod => {
		var parts, i, name;

		// is this already named?
		if ( names.hasOwnProperty( mod.id ) ) {
			return;
		}

		parts = mod.id.split( '/' );

		i = parts.length;
		while ( i-- ) {
			name = sanitize( parts.slice( i ).join( '_' ) );

			if ( !used.hasOwnProperty( name ) ) {
				break;
			}
		}

		while ( used.hasOwnProperty( name ) ) {
			name = '_' + name;
		}

		used[ name ] = true;
		names[ mod.id ] = name;
	});

	return names;
}
