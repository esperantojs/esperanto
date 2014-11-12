var gobble = require( 'gobble' ),
	lib = {
		node: require( './gobble/lib' ).moveTo( 'lib' ),
		browser: require( './gobble/browser' ).moveTo( 'dist' )
	};

module.exports = gobble([
	lib.node,

	lib.browser,
	lib.browser.transform( 'uglifyjs', { ext: '.min.js' })
]);
