var transform = require('./transform');
var amd = require('./generators/amd');
var cjs = require('./generators/cjs');
module.exports = {
	toAmd: function ( source, options ) {
		options = options || {};

		var transformed = transform( source, options, true );
		return amd( transformed, options );
	},

	toCjs: function ( source, options ) {
		options = options || {};

		var transformed = transform( source, options );
		return cjs( transformed, options );
	}
}