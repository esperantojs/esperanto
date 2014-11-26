var gobble = require( 'gobble' );

gobble.cwd( __dirname, '..' );

module.exports = gobble( 'src' )
	.transform( 'esperanto-bundle', {
		entry: 'esperanto',
		type: 'cjs'
	})
	.transform( 'es6-transpiler' );
