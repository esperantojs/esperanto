import getUnscopedNames from '../utils/getUnscopedNames';

export default function topLevelScopeConflicts ( bundle ) {
	var conflicts = {}, inBundle = {};

	bundle.modules.forEach( mod => {
		var names =

			// bundle name is in top scope
			[ /*bundle.uniqueNames[ mod.id ]*/ ]

			// all top defined identifiers are in top scope
			.concat( mod.ast._scope.names )

			// all unattributed identifiers could collide with top scope
			.concat( getUnscopedNames( mod ) );

		if ( mod._exportsNamespace ) {
			//names.push( bundle.uniqueNames[ mod.id ] );
			conflicts[ bundle.uniqueNames[ mod.id ] ] = true;
		}

		// merge this module's top scope with bundle top scope
		names.forEach( name => {
			if ( inBundle.hasOwnProperty( name ) ) {
				conflicts[ name ] = true;
			} else {
				inBundle[ name ] = true;
			}
		});
	});

	return conflicts;
}