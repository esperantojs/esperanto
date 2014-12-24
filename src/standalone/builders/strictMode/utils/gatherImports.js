export default function gatherImports ( imports, getName ) {
	var importedBindings = {}, toRewrite = {};

	imports.forEach( x => {
		x.specifiers.forEach( s => {
			var name, replacement;

			if ( s.batch ) {
				name = s.name;
			} else {
				name = s.as;
			}

			if ( s.batch ) {
				replacement = s.name;
			} else {
				if ( s.default ) {
					replacement = getName( x ) + '[\'default\']';
				} else {
					replacement = getName( x ) + '.' + s.name;
				}
			}

			importedBindings[ name ] = replacement;

			if ( !x.passthrough ) {
				toRewrite[ name ] = replacement;
			}
		});
	});

	return [ importedBindings, toRewrite ];
}
