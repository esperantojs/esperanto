var gobble = require( 'gobble' ),
	src, index, app, bundle, css, vendor;

src = gobble( 'src' );

index = src.include( 'index.html' );
app = gobble( 'src/ractive_components' ).map( 'ractive' );
bundle = gobble([
	'src/bundle',
	gobble( '../dist' ).include( 'esperanto.js' )
]).transform( 'concat', { files: '**/*.js', dest: 'bundle.js' });
css = src.transform( 'sass', { src: 'scss/main.scss', dest: 'min.css' });

// Compile the app.html file
vendor = gobble( 'src/vendor', { static: true });
app = gobble([ app, vendor ]).transform( 'requirejs', {
	name: 'app',
	out: 'app.js',
	paths: {
		acorn: 'empty:',
		esperanto: 'empty:',
		ractive: 'ractive/ractive-legacy'
	},
	optimize: 'none'
}).map( 'amdclean', {
	wrap: {
		start: 'var App = (function () {',
		end: 'return app;}());'
	}
});

// Uglify for production
if ( gobble.isBuild ) {
	app = app.map( 'uglifyjs' );
	bundle = bundle.map( 'uglifyjs' );
}

module.exports = [ index, app, bundle, css, 'src/files' ];
