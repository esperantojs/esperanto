var gobble = require( 'gobble' ),
	sander = require( 'sander' ),
	esperanto = require( '../' );

gobble.cwd( __dirname, '..' );

// TODO replace this with gobble-esperanto-bundle when ready
module.exports = gobble( 'src' )
	.transform( function ( inputdir, outputdir, options ) {
		return esperanto.bundle({
			base: inputdir,
			entry: 'esperanto',
			skip: [ 'bundler/getBundle' ]
		}).then( function ( bundle ) {
			return sander.writeFile( outputdir, 'esperanto.js', bundle.toUmd({
				defaultOnly: true,
				name: 'esperanto'
			}) );
		});
	})
	.transform( 'es6-transpiler', {
		disallowUnknownReferences: false
	});
