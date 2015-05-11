export default function getRenamedImports ( mod ) {
	let renamed = [];

	mod.imports.forEach( x => {
		if ( x.specifiers ) {
			x.specifiers.forEach( s => {
				if ( s.name !== s.as && !~renamed.indexOf( s.name ) ) {
					renamed.push( s.name );
				}
			});
		}
	});

	return renamed;
}