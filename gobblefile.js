var fs = require( 'fs' ),
	path = require( 'path' ),
	gobble = require( 'gobble' ),
	esperanto;

esperanto = (function () {
	var methods = {
		amd: 'toAmd',
		cjs: 'toCjs'
	};

	function esperanto ( es6, options ) {
		var method = methods[ options.type || 'amd' ];

		if ( !method ) {
			throw new Error( 'The gobble-esperanto plugin supports the following types: amd, cjs' );
		}

		return require( './lib/esperanto' )[ method ]( es6, options );
	}

	esperanto.defaults = {
		accept: '.js'
	};

	return esperanto;
}());


module.exports = [
	// Compile a UMD version, via RequireJS and AMDClean
	gobble( 'src' ).map( esperanto, { defaultOnly: true, addUseStrict: false })
		.transform( 'requirejs', {
			out: 'esperanto.js',
			name: 'esperanto',
			paths: {
				acorn: 'empty:'
			},
			exclude: [ 'acorn' ],
			optimize: 'none'
		})
		.map( 'amdclean', {
			wrap: {
				start: fs.readFileSync( 'wrapper/start.js' ).toString(),
				end: fs.readFileSync( 'wrapper/end.js' ).toString()
			}
		})
		.map( 'jsbeautify', {
			indent_with_tabs: true,
			preserve_newlines: true
		})
		.moveTo( 'dist' ),

	// Compile a node.js version
	gobble( 'src' ).map( esperanto, { type: 'cjs', defaultOnly: true }).moveTo( 'lib' )
];
