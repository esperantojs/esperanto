export default function gatherImports ( imports ) {
	var chains = {}, identifierReplacements = {};

	imports.forEach( x => {
		x.specifiers.forEach( s => {
			var name, replacement;

			if ( s.isBatch ) {
				return;
			}

			name = s.as;
			replacement = x.name + ( s.isDefault ? `['default']` : `.${s.name}` );

			if ( !x.passthrough ) {
				identifierReplacements[ name ] = replacement;
			}

			chains[ name ] = replacement;
		});
	});

	return [ chains, identifierReplacements ];
}
