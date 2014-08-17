import transform from './transform';
import amd from './generators/amd';
import cjs from './generators/cjs';

export default {
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
};
