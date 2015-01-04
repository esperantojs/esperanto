var gobble = require( 'gobble' ),
	node, browser;

gobble.cwd( __dirname );

node = gobble( 'src' ).transform( 'esperanto-bundle', {
	entry: 'esperanto',
	type: 'cjs'
});

browser = gobble( 'src' ).transform( 'esperanto-bundle', {
	entry: 'esperanto',
	dest: 'esperanto.browser.js',
	type: 'umd',
	name: 'esperanto',
	skip: [ 'bundler/getBundle' ]
});

module.exports = gobble([ node, browser ]).transform( 'es6-transpiler', {
	disallowUnknownReferences: false
});