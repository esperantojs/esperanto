var path = require( 'path' ),
	sander = require( 'sander' ),
	Promise = sander.Promise,
	esperanto = require( '../' );

var methods = {
	amd: 'toAmd',
	cjs: 'toCjs',
	umd: 'toUmd'
};

module.exports = function ( options ) {
	var method;

	if ( options.type && !methods[ options.type ] ) {
		console.error( 'The --type (-t) option must be one of amd, cjs, umd' );
		process.exit( 1 );
	}

	method = methods[ options.type ] || 'toAmd';

	if ( options.bundle ) {
		bundle( options, method ).catch( debug );
	} else {
		convert( options, method ).catch( debug );
	}
};

function bundle ( options, method ) {
	var bundleOptions, file;

	if ( !options.input ) {
		console.error( 'You must specify an --input (-i) option when bundling' );
		process.exit( 1 );
	}

	bundleOptions = {
		base: path.resolve( options.basedir || '' )
	};

	if ( options.skip ) {
		bundleOptions.skip = options.skip.split( ',' ).map( function ( file ) {
			return file.replace( /\.js$/, '' );
		});
	}

	// entry should be relative to base
	if ( options.basedir && !sander.existsSync( path.join( bundleOptions.base, options.input ) ) ) {
		// file doesn't exist relative to base...
		file = path.resolve( options.input ).replace( bundleOptions.base + '/', '' );
	} else {
		file = path.resolve( bundleOptions.base, options.input );
	}

	bundleOptions.entry = file;

	return esperanto.bundle( bundleOptions ).then( function ( bundle ) {
		var transpiled, promises;

		transpiled = bundle[ method ]({
			name: options.name,
			amdName: options.amdName,
			strict: options.strict,
			sourceMap: options.sourcemap,
			sourceMapFile: path.resolve( options.output )
		});

		if ( options.output ) {
			promises = [ sander.writeFile( options.output, transpiled.code ) ];

			if ( options.sourcemap === true ) {
				promises.push( sander.writeFile( options.output + '.map', transpiled.map ) );
			}

			return Promise.all( promises );
		} else {
			process.stdout.write( transpiled );
		}
	});
}

function convert ( options, method ) {
	if ( options.input ) {
		return sander.readFile( options.input )
			.then( String )
			.then( run );
	} else {
		return readFromStdin().then( run );
	}

	function run ( source ) {
		var transpiled, promises;

		transpiled = esperanto[ method ]( source, {
			strict: options.strict,
			name: options.name,
			amdName: options.amdName,
			sourceMap: options.sourcemap,
			sourceMapSource: options.input,
			sourceMapFile: options.output
		});

		if ( options.output ) {
			promises = [ sander.writeFile( options.output, transpiled.code ) ];

			if ( options.sourcemap === true ) {
				promises.push( sander.writeFile( options.output + '.map', transpiled.map ) );
			}

			return Promise.all( promises );
		}

		process.stdout.write( transpiled.code );
	}
}

function readFromStdin () {
	return new Promise( function ( fulfil, reject ) {
		var data = '';

		if ( process.stdin.isTTY ) {
			console.log( 'No input detected! Try using the --input (-i) option' );
			process.exit( 1 );
		}

		process.stdin.setEncoding( 'utf8' );

		process.stdin.on( 'readable', function () {
			var chunk = process.stdin.read();
			if ( chunk !== null ) {
				data += chunk;
			}
		});

		process.stdin.on( 'end', function() {
			fulfil( data );
		});

		process.stdin.on( 'error', reject );
	});
}

function debug ( err ) {
	setTimeout( function () {
		throw err;
	});
}