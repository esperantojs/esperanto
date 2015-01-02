export default function getImportNames ( mod ) {
	var renamed = [];

	mod.imports.forEach( x => {
		if ( x.specifiers ) {
			x.specifiers.forEach( s => {
				renamed.push( s.name );
			});
		}
	});

	return renamed;
}