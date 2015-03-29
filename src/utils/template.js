/**
 * Creates a template function from a template string. The template
   may have `<%= someVar %>` interpolators, and the returned function
   should be called with a data object e.g. `{ someVar: 'someData' }`
 * @param {string} str - the template string
 * @returns {function}
 */
const PLACEHOLDER = /<%=\s*([^\s]+)\s*%>/g;

export default function template ( str ) {
	return data =>
		str.replace( PLACEHOLDER, ( match, $1 ) =>
			( $1 in data ? data[ $1 ] : match )
		);
}