import getUnscopedNames from '../utils/getUnscopedNames';

export default function topLevelScopeConflicts ( bundle ) {
	var conflicts = {}, inScope = {};

	bundle.modules.forEach( mod => {
		var inModule = {};

		// bundle name is in top scope
		inModule[ bundle.uniqueNames[ mod.id ] ] = true;

		// all top defined identifiers are in top scope
		mod.ast._scope.names.forEach( name => {
			inModule[ name ] = true;
		});

		// all unattributed identifiers could collide with top scope
		Object.keys( getUnscopedNames( mod ) ).forEach( name => {
			inModule[ name ] = true;
		});

		// merge this module's top scope with bundle top scope
		Object.keys( inModule ).forEach( name => {
			if ( inScope.hasOwnProperty( name ) ) {
				conflicts[ name ] = true;
			} else {
				inScope[ name ] = true;
			}
		});
	});

	return conflicts;
}