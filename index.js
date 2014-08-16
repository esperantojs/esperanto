var recast = require( 'recast' ),
	parse = require( './lib/parse' ),
	generators = require( './lib/generators' );

module.exports = {
	toAmd: function ( source, options ) {
		options = options || {};

		var parsed = parse( source, options );
		return generators.amd( parsed, options );
	},

	toCjs: function ( source, options ) {
		options = options || {};

		var parsed = parse( source, options );
		return generators.cjs( parsed, options );
	}
};
