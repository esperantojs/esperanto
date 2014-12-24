export default function importsByModule ( bundle ) {
	var imports = {};

	bundle.modules.forEach( mod => {
		mod.imports.forEach(i => {
			i.specifiers.forEach(s => {
				if ( !s.default ) {
					(imports[ i.id ] || (imports[ i.id ] = {}))[ s.name ] = true;
				}
			});
		});
	});

	return imports;
}
