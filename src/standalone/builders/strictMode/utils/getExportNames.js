export default function getExportNames ( exports ) {
	var result = [];

	exports.forEach( x => {
		if ( x.default ) return;

		if ( x.declaration ) {
			result.push( x.name );
			return;
		}

		x.specifiers.forEach( s => {
			result.push( s.name );
		});
	});

	return result;
}