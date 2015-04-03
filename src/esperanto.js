import hasOwnProp from 'utils/hasOwnProp';
import hasNamedImports from 'utils/hasNamedImports';
import hasNamedExports from 'utils/hasNamedExports';
import getStandaloneModule from 'standalone/getModule';
import getBundle from 'bundler/getBundle';
import moduleBuilders from 'standalone/builders';
import bundleBuilders from 'bundler/builders';
import concat from 'bundler/builders/concat';
import { getName } from 'utils/mappers';
import { startTimer, endTimer } from './utils/time';

let deprecateMessage = 'options.defaultOnly has been deprecated, and is now standard behaviour. To use named imports/exports, pass `strict: true`.';
let alreadyWarned = false;

function transpileMethod ( format ) {
	return function ( source, options = {} ) {
		let mod = getStandaloneModule({
			source,
			getModuleName: options.getModuleName,
			strict: options.strict
		});

		if ( 'defaultOnly' in options && !alreadyWarned ) {
			// TODO link to a wiki page explaining this, or something
			console.log( deprecateMessage );
			alreadyWarned = true;
		}

		if ( options.absolutePaths && !options.amdName ) {
			throw new Error( 'You must specify an `amdName` in order to use the `absolutePaths` option' );
		}

		let builder;

		startTimer( 'build' );

		if ( !options.strict ) {
			// ensure there are no named imports/exports. TODO link to a wiki page...
			if ( hasNamedImports( mod ) || hasNamedExports( mod ) ) {
				throw new Error( 'You must be in strict mode (pass `strict: true`) to use named imports or exports' );
			}

			builder = moduleBuilders.defaultsMode[ format ];
		} else {
			builder = moduleBuilders.strictMode[ format ];
		}

		let transpiled = builder( mod, options );
		transpiled.stats.build = endTimer( 'build' );
		return transpiled;
	};
}

export default {
	toAmd: transpileMethod( 'amd' ),
	toCjs: transpileMethod( 'cjs' ),
	toUmd: transpileMethod( 'umd' ),

	bundle: function ( options ) {
		return getBundle( options ).then( function ( bundle ) {
			return {
				imports: bundle.externalModules.map( mod => mod.id ),
				exports: flattenExports( bundle.entryModule.exports ),

				toAmd: options => transpile( 'amd', options ),
				toCjs: options => transpile( 'cjs', options ),
				toUmd: options => transpile( 'umd', options ),

				concat: options => concat( bundle, options || {} )
			};

			function transpile ( format, options = {} ) {
				if ( 'defaultOnly' in options && !alreadyWarned ) {
					// TODO link to a wiki page explaining this, or something
					console.log( deprecateMessage );
					alreadyWarned = true;
				}

				let builder;

				if ( !options.strict ) {
					// ensure there are no named imports/exports
					if ( hasNamedExports( bundle.entryModule ) ) {
						throw new Error( 'Entry module can only have named exports in strict mode (pass `strict: true`)' );
					}

					bundle.modules.forEach( mod => {
						mod.imports.forEach( x => {
							if ( hasOwnProp.call( bundle.externalModuleLookup, x.id ) && ( !x.isDefault && !x.isBatch ) ) {
								throw new Error( 'You can only have named external imports in strict mode (pass `strict: true`)' );
							}
						});
					});

					builder = bundleBuilders.defaultsMode[ format ];
				} else {
					builder = bundleBuilders.strictMode[ format ];
				}

				startTimer( 'build' );
				let transpiled = builder( bundle, options );
				transpiled.stats.build = endTimer( 'build' );

				return transpiled;
			}
		});
	}
};

function flattenExports ( exports ) {
	let flattened = [];

	exports.forEach( x => {
		if ( x.isDefault ) {
			flattened.push( 'default' );
		}

		else if ( x.name ) {
			flattened.push( x.name );
		}

		else if ( x.specifiers ) {
			flattened.push.apply( flattened, x.specifiers.map( getName ) );
		}
	});

	return flattened;
}
