export default function template ( str ) {
	return function ( data ) {
		return str.replace( /\<%=\s*([^\s]+)\s*%\>/g, function ( match, $1 ) {
			return $1 in data ? data[ $1 ] : match;
		});
	};
}