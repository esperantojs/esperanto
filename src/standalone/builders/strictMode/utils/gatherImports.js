export default function gatherImports ( imports, getName ) {
	var chains = {}, identifierReplacements = {};

	imports.forEach( x => {
		var moduleName = getName( x );

		x.specifiers.forEach( s => {
			var name, replacement;

			if ( s.isBatch ) {
				return;
			}

			name = s.as;
			replacement = moduleName + ( s.isDefault ? `['default']` : `.${s.name}` );

			if ( !x.passthrough ) {
				identifierReplacements[ name ] = replacement;
			}

			chains[ name ] = replacement;
		});
	});

	return [ chains, identifierReplacements ];
}
