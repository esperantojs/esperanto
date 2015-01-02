import hasOwnProp from 'utils/hasOwnProp';
import getUnscopedNames from './getUnscopedNames';
import getRenamedImports from './getRenamedImports';

export default function topLevelScopeConflicts ( bundle ) {
	var conflicts = {}, inBundle = {};

	bundle.modules.forEach( mod => {
		var names =

			// all top defined identifiers are in top scope
			mod.ast._scope.names

			// all unattributed identifiers could collide with top scope
			.concat( getUnscopedNames( mod ) )

			.concat( getRenamedImports( mod ) );

		if ( mod._exportsNamespace ) {
			conflicts[ bundle.uniqueNames[ mod.id ] ] = true;
		}

		// merge this module's top scope with bundle top scope
		names.forEach( name => {
			if ( hasOwnProp.call( inBundle, name ) ) {
				conflicts[ name ] = true;
			} else {
				inBundle[ name ] = true;
			}
		});
	});

	return conflicts;
}