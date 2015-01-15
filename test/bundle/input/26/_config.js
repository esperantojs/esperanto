module.exports = {
	description: 'transforms input sources',
	transform: function ( source ) {
		return source.replace( /foo/g, 'bar' );
	}
};