var fs = require( 'fs' ),
	path = require( 'path' ),
	esperanto = require( '../lib/esperanto' ),
	samples,
	iterations = 1000;

samples = fs.readdirSync( path.join( __dirname, 'samples' ) ).map( function ( file ) {
	return {
		name: file,
		code: fs.readFileSync( path.join( __dirname, 'samples', file ) ).toString()
	};
});

tests = [
	{
		name: 'esperanto',
		fn: function ( code, filename, type ) {
			code = esperanto[ type === 'amd' ? 'toAmd' : 'toCjs' ]( code, { strict: true });
			return code;
		}
	},

	{
		name: 'traceur',
		skip: process.argv[2] !== 'traceur',
		before: function () {
			traceur = require( 'traceur' );
		},
		fn: function ( code, filename, type ) {
			return traceur.compile( code, {
				filename: filename,
				modules: type,
				sourceMaps: false
			}).js;
		},
		after: function () {
			delete require.cache[ require.resolve( 'traceur' ) ];
		},
		alias: { cjs: 'commonjs' }
	},

	{
		name: 'transpile',
		skip: process.argv[2] === 'traceur',
		before: function () {
			transpile = require( 'transpile' );
		},
		fn: function ( code, filename, type ) {
			return transpile.to({
				name: filename,
				source: code,
				metadata: { format: 'es6' }
			}, type )
		},
		after: function () {
			delete require.cache[ require.resolve( 'transpile' ) ];
		}
	}
];


tests.forEach( function ( test ) {
	var out, type = 'cjs';

	if ( test.skip ) {
		return;
	}

	if ( test.alias ) {
		type = test.alias[ type ] || type;
	}

	console.log( '\nRunning %s test...', test.name );

	test.before && test.before();

	// First, save the result to disk
	out = path.join( __dirname, 'output', test.name );
	try { fs.mkdirSync( out ); } catch ( err ) {}

	samples.forEach( function ( sample ) {
		var result = test.fn( sample.code, sample.name, type );
		fs.writeFileSync( path.join( out, sample.name ), result );
	});


	// Then run the tests
	var start = Date.now();
	samples.forEach( function ( sample ) {
		var i = iterations;
		while ( i-- ) {
			test.fn( sample.code, sample.name, type );
		}
	});
	console.log( '...finished %s iterations in %sms\n', iterations, Date.now() - start );


	test.after && test.after();
})
