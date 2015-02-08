var gobble = require( 'gobble' );
var path = require( 'path' );
var resolve = require( 'resolve' );
var Promise = require( 'sander' ).Promise;

var banner, node, browser;

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
	sourceMap: false,

	// bundle magic-string and its dependency, vlq
	resolvePath: function ( importee, importer ) {
		return new Promise( function ( fulfil, reject ) {
			var callback = function ( err, result ) {
				if ( err ) {
					reject( err );
				} else {
					fulfil( result );
				}
			};

			resolve( importee, {
				basedir: path.dirname( importer ),
				packageFilter: function ( pkg ) {
					if ( pkg[ 'jsnext:main' ] ) {
						pkg.main = pkg[ 'jsnext:main' ];
						return pkg;
					}

					var err = new Error( 'package ' + pkg.name + ' does not supply a jsnext:main field' );
					err.code = 'ENOENT'; // hack
					reject( err );
					return {};
				}
			}, callback );
		});
	}
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