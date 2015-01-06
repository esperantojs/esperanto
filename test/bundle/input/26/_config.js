module.exports = {
	transform: function ( source ) {
		return source.replace( /foo/g, 'bar' );
	}
};