/**
 * Creates a template function from a template string. The template
   may have `<%= someVar %>` interpolators, and the returned function
   should be called with a data object e.g. `{ someVar: 'someData' }`
 * @param {string} str - the template string
 * @returns {function}
 */
export default function template ( str ) {
	return function ( data ) {
		return str.replace( /<%=\s*([^\s]+)\s*%>/g, function ( match, $1 ) {
			return $1 in data ? data[ $1 ] : match;
		});
	};
}