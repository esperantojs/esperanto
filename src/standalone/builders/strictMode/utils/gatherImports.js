export default function gatherImports ( imports, getName ) {
	var chains = {}, identifierReplacements = {};

	imports.forEach( x => {
		x.specifiers.forEach( s => {
			var name, replacement;

			if ( s.batch ) {
				name = replacement = s.name;

				if ( !x.passthrough ) {
					identifierReplacements[ name ] = replacement;
				}
			}

			else {
				name = s.as;

				if ( s.isDefault ) {
					replacement = getName( x ) + '[\'default\']';
				} else {
					replacement = getName( x ) + '.' + s.name;
				}

				if ( !x.passthrough ) {
					identifierReplacements[ name ] = replacement;
				}
			}

			chains[ name ] = replacement;
		});
	});

	return [ chains, identifierReplacements ];
}
