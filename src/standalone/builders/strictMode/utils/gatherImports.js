export default function gatherImports ( imports, getName ) {
	var importedBindings = {}, identifierReplacements = {};

	imports.forEach( x => {
		x.specifiers.forEach( s => {
			var name, replacement;

			if ( s.batch ) {
				name = replacement = s.name;

				if ( !x.passthrough ) {
					identifierReplacements[ name ] = {
						name: replacement,
						namespace: true
					};
				}
			}

			else {
				name = s.as;

				if ( s.default ) {
					replacement = getName( x ) + '[\'default\']';
				} else {
					replacement = getName( x ) + '.' + s.name;
				}

				if ( !x.passthrough ) {
					identifierReplacements[ name ] = {
						name: replacement,
						readOnly: true
					};
				}
			}

			importedBindings[ name ] = replacement;
		});
	});

	return [ importedBindings, identifierReplacements ];
}
