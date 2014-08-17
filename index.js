var transform = require( './lib/transform' ),
	generators = require( './lib/generators' );

module.exports = {
	toAmd: function ( source, options ) {
		options = options || {};

		var transformed = transform( source, options, true );
		return generators.amd( transformed, options );
	},

	toCjs: function ( source, options ) {
		options = options || {};

		var transformed = transform( source, options );
		return generators.cjs( transformed, options );
	}
};
