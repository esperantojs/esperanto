export default function getExportNames ( exports ) {
	var result = {};

	exports.forEach( x => {
		if ( x.default ) return;

		if ( x.declaration ) {
			result[ x.name ] = x.name;
			return;
		}

		x.specifiers.forEach( s => {
			result[ s.name ] = s.name;
		});
	});

	return result;
}