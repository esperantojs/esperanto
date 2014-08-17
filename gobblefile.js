var fs = require( 'fs' ),
	path = require( 'path' ),
	gobble = require( 'gobble' ),

	dist, lib;

// Compile a UMD version, via RequireJS and AMDClean
dist = gobble( 'src' ).map( 'esperanto', { defaultOnly: true, addUseStrict: false })
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
	.moveTo( 'dist' );

module.exports = [
	dist,
	dist.map( 'uglifyjs', { ext: '.min.js' }),

	// Compile a node.js version
	gobble( 'src' ).map( 'esperanto', { type: 'cjs', defaultOnly: true }).moveTo( 'lib' )
];
