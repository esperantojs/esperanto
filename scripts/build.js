#!/usr/bin/env node

var spawn = require( 'child_process' ).spawn;
var fs = require( 'fs' );
var join = require( 'path' ).join;

function copy( src, dst ) {
	fs.createReadStream( src ).pipe( fs.createWriteStream( dst ));
}

// This command builds the library from source, and
// runs all the tests.
var mocha = spawn( 'mocha' );
mocha.stdout.pipe( process.stdout );
mocha.stderr.pipe( process.stderr );
mocha.on( 'close', function ( code ) {
	if ( code !== 0 ) {
		process.exit( code );
	}

  // If the tests pass, we just need to copy
  // test/lib/esperanto.js to the root
	copy( 'test/lib/esperanto.js', 'esperanto.js' );

	if ( !fs.existsSync( 'dist' ) ) {
		fs.mkdirSync( 'dist' );
	}

	// Copy all dist files, including sourcemaps
	fs.readdir( 'test/lib', function ( err, children ) {
		if ( err ) { throw err; }

		children.forEach( function ( child ) {
			copy( join( 'test/lib', child ), join( 'dist', child ) );
		});
	});
});
