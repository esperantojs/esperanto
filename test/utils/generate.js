var path = require( 'path' ),
	sander = require( 'sander' ),
	Promise = sander.Promise;

process.chdir( __dirname );

require( './build' )().then( function ( esperanto ) {
	generateFastModeOutput();
	generateStrictModeOutput();
	generateBundleOutput();

	function generateFastModeOutput () {
		var profiles = [
			{ outputdir: 'amd', method: 'toAmd' },
			{ outputdir: 'cjs', method: 'toCjs' },
			{ outputdir: 'umd', method: 'toUmd', options: { name: 'myModule' } }
		];

		return cleanup().then( buildAll ).catch( function ( err ) {
			console.log( 'err', err );
		});

		function cleanup () {
			return sander.rimraf( '../fastMode/output' );
		}

		function buildAll () {
			return sander.readdir( '../samples' ).then( function ( samples ) {
				return Promise.all( samples.map( build ) );
			});
		}

		function build ( sample ) {
			return sander.readFile( '../samples', sample, 'source.js' ).then( String ).then( function ( source ) {
				var config = require( '../samples/' + sample + '/_config' ),
					promises;

				if ( config.strict ) return;

				console.log( 'sample', sample );

				promises = profiles.map( function ( profile ) {
					var transpiled = esperanto[ profile.method ]( source, {
						name: profile.options && profile.options.name,
						amdName: config.amdName,
						absolutePaths: config.absolutePaths,
						strict: profile.options && profile.options.strict,
						banner: config.banner,
						footer: config.footer
					});
					return sander.writeFile( '../fastMode/output', profile.outputdir, sample + '.js', transpiled.code );
				});

				return Promise.all( promises );
			});
		}
	}

	function generateStrictModeOutput () {
		var profiles = [
			{ outputdir: 'amd', method: 'toAmd', options: { strict: true } },
			{ outputdir: 'cjs', method: 'toCjs', options: { strict: true } },
			{ outputdir: 'umd', method: 'toUmd', options: { strict: true, name: 'myModule' } }
		];

		return cleanup().then( buildAll ).catch( function ( err ) {
			console.log( 'err', err );
		});

		function cleanup () {
			return sander.rimraf( '../strictMode/output' );
		}

		function buildAll () {
			return sander.readdir( '../samples' ).then( function ( samples ) {
				return Promise.all( samples.map( build ) );
			});
		}

		function build ( sample ) {
			return sander.readFile( '../samples', sample, 'source.js' ).then( String ).then( function ( source ) {
				var config = require( '../samples/' + sample + '/_config' ),
					promises;

				promises = profiles.map( function ( profile ) {
					var transpiled = esperanto[ profile.method ]( source, {
						name: profile.options && profile.options.name,
						amdName: config.amdName,
						absolutePaths: config.absolutePaths,
						strict: profile.options && profile.options.strict,
						banner: config.banner,
						footer: config.footer,
						_evilES3SafeReExports: config._evilES3SafeReExports
					});
					return sander.writeFile( '../strictMode/output', profile.outputdir, sample + '.js', transpiled.code );
				});

				return Promise.all( promises );
			});
		}
	}

	function generateBundleOutput () {
		var profiles = [
			{ description: 'bundle.concat()', method: 'concat', outputdir: 'concat' },
			{ description: 'bundle.toAmd()', method: 'toAmd', outputdir: 'amdDefaults' },
			{ description: 'bundle.toCjs()', method: 'toCjs', outputdir: 'cjsDefaults' },
			{ description: 'bundle.toUmd()', method: 'toUmd', outputdir: 'umdDefaults', options: { name: 'myModule' } },
			{ description: 'bundle.toAmd({ strict: true })', method: 'toAmd', outputdir: 'amd', options: { strict: true } },
			{ description: 'bundle.toCjs({ strict: true })', method: 'toCjs', outputdir: 'cjs', options: { strict: true } },
			{ description: 'bundle.toUmd({ strict: true })', method: 'toUmd', outputdir: 'umd', options: { strict: true, name: 'myModule' } }
		];

		return cleanup().then( buildAll ).catch( function ( err ) {
			console.log( 'err', err );
		});

		function cleanup () {
			return sander.rimraf( '../bundle/output' );
		}

		function buildAll () {
			return sander.readdir( '../bundle/input' ).then( function ( sourceBundles ) {
				return Promise.all( sourceBundles.map( build ) );
			});
		}

		function build ( sourceBundle ) {
			var config;

			if ( /DS_Store/.test( sourceBundle ) ) return;

			config = require( '../bundle/input/' + sourceBundle + '/_config' );

			var promises = profiles.map( function ( profile ) {
				return esperanto.bundle({
					base: path.join( '../bundle/input', sourceBundle ),
					entry: 'main',
					skip: config.skip,
					names: config.names,
					transform: config.transform,
					resolvePath: config.resolvePath
				}).then( function ( bundle ) {
					try {
						var transpiled = bundle[ profile.method ]({
							strict: profile.options && profile.options.strict,
							name: profile.options && profile.options.name,
							amdName: config.amdName,
							banner: config.banner,
							footer: config.footer
						});
						return sander.writeFile( '../bundle/output', profile.outputdir, sourceBundle + '.js', transpiled.code );
					} catch ( err ) {
						// some modules can't be transpiled with defaultOnly
						if ( !/strict mode/.test( err.message ) && !/bundles that have no imports/.test( err.message ) ) {
							setTimeout( function () { throw err; });
						}
					}
				});
			});

			return Promise.all( promises );
		}
	}
}).catch( function ( err ) {
	console.log( 'err', err );
});
