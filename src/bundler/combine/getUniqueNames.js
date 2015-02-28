import hasOwnProp from 'utils/hasOwnProp';
import builtins from 'utils/builtins';
import { default as sanitize, splitPath } from 'utils/sanitize';

export default function getUniqueNames ( modules, externalModules, userNames ) {
	var names = {}, used = {};

	// copy builtins
	builtins.forEach( n => used[n] = true );

	// copy user-specified names
	if ( userNames ) {
		Object.keys( userNames ).forEach( n => {
			names[n] = userNames[n];
			used[ userNames[n] ] = true;
		});
	}

	// infer names from default imports
	modules.forEach( mod => {
		mod.imports.forEach( x => {
			if ( x.isDefault && !hasOwnProp.call( names, x.id ) && !hasOwnProp.call( used, x.as ) ) {
				names[ x.id ] = x.as;
				used[ x.as ] = true;
			}
		});
	});

	// for the rest, make names as compact as possible without
	// introducing conflicts
	modules.concat( externalModules ).forEach( mod => {
		var parts, i, name;

		// is this already named?
		if ( hasOwnProp.call( names, mod.id ) ) {
			return;
		}

		parts = splitPath( mod.id );

		i = parts.length;
		while ( i-- ) {
			name = sanitize( parts.slice( i ).join( '_' ) );

			if ( !hasOwnProp.call( used, name ) ) {
				break;
			}
		}

		while ( hasOwnProp.call( used, name ) ) {
			name = '_' + name;
		}

		used[ name ] = true;
		names[ mod.id ] = name;
	});

	return names;
}
