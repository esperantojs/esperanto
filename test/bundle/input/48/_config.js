module.exports = {
	description: 'handles resolvePath failure',
	resolvePath: function ( importee ) {
		if ( importee[0] !== '.' ) return null;
		return importee;
	},
	imports: [ 'external' ]
};