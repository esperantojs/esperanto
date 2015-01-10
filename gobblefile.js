var gobble = require( 'gobble' ),
	banner, node, browser;

gobble.cwd( __dirname );

banner = require( 'fs' ).readFileSync( __dirname + '/src/banner.js', 'utf-8' )
	.replace( '${VERSION}', require( './package.json' ).version )
	.replace( '${TODAY}', today() );

node = gobble( 'src' ).transform( 'esperanto-bundle', {
	entry: 'esperanto',
	type: 'cjs',
	banner: banner,
	sourceMap: false
});

browser = gobble( 'src' ).transform( 'esperanto-bundle', {
	entry: 'esperanto',
	dest: 'esperanto.browser.js',
	type: 'umd',
	name: 'esperanto',
	skip: [ 'bundler/getBundle' ],
	banner: banner,
	sourceMap: false
});

module.exports = gobble([ node, browser ]).transform( 'es6-transpiler', {
	disallowUnknownReferences: false
});


function today () {
	var d = new Date();

	return [
		d.getFullYear(),
		pad( d.getMonth() + 1 ),
		pad( d.getDate() )
	].join( '-' );
}

function pad ( num ) {
	return num < 10 ? '0' + num : num;
}