var gobble = require( 'gobble' );
var path = require( 'path' );
var resolve = require( 'resolve' );
var Promise = require( 'sander' ).Promise;

gobble.cwd( __dirname );

var banner = require( 'fs' ).readFileSync( __dirname + '/src/banner.js', 'utf-8' )
	.replace( '${VERSION}', require( './package.json' ).version )
	.replace( '${TODAY}', today() );

var es5 = gobble( 'src' ).transform( 'babel' );

var node = es5
	.transform( 'esperanto-bundle', {
		entry: 'esperanto',
		type: 'cjs',
		banner: banner,
		strict: true,
		sourceMap: true
	});

var browser = es5
	.transform( 'esperanto-bundle', {
		entry: 'esperanto',
		dest: 'esperanto.browser.js',
		type: 'umd',
		name: 'esperanto',
		skip: [ 'bundler/getBundle' ],
		banner: banner,
		strict: true,
		sourceMap: true,

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

module.exports = gobble([ node, browser ]);


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