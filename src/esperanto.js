import chalk from 'chalk';
import hasNamedImports from 'utils/hasNamedImports';
import hasNamedExports from 'utils/hasNamedExports';
import getStandaloneModule from 'standalone/getModule';
import getBundle from 'bundler/getBundle';
import moduleBuilders from 'standalone/builders';
import bundleBuilders from 'bundler/builders';
import concat from 'bundler/builders/concat';
import { getName } from 'utils/mappers';

let deprecateMessages = {
	defaultOnly: 'options.defaultOnly has been deprecated, and is now standard behaviour. To use named imports/exports, pass `strict: true`.',
	standalone: chalk.red.bold( '[DEPRECATION NOTICE] Esperanto is no longer under active development. To convert an ES6 module to another format, consider using Babel (https://babeljs.io)' ),
	bundle: chalk.red.bold( '[DEPRECATION NOTICE] Esperanto is no longer under active development. To bundle ES6 modules, consider using Rollup (https://github.com/rollup/rollup). See https://github.com/rollup/rollup/wiki/Migrating-from-Esperanto for help migrating' )
};

let alreadyWarned = {
	defaultOnly: false,
	standalone: false,
	bundle: false
};

function transpileMethod ( format ) {
	if ( !alreadyWarned.standalone ) {
		console.error( deprecateMessages.standalone );
		alreadyWarned.standalone = true;
	}

	return function ( source, options = {} ) {
		let mod = getStandaloneModule({
			source,
			getModuleName: options.getModuleName,
			strict: options.strict
		});

		if ( 'defaultOnly' in options && !alreadyWarned.defaultOnly ) {
			// TODO link to a wiki page explaining this, or something
			console.error( deprecateMessages.defaultOnly );
			alreadyWarned.defaultOnly = true;
		}

		if ( options.absolutePaths && !options.amdName ) {
			throw new Error( 'You must specify an `amdName` in order to use the `absolutePaths` option' );
		}

		let builder;

		if ( !options.strict ) {
			// ensure there are no named imports/exports. TODO link to a wiki page...
			if ( hasNamedImports( mod ) || hasNamedExports( mod ) ) {
				throw new Error( 'You must be in strict mode (pass `strict: true`) to use named imports or exports' );
			}

			builder = moduleBuilders.defaultsMode[ format ];
		} else {
			builder = moduleBuilders.strictMode[ format ];
		}

		return builder( mod, options );
	};
}

export const toAmd = transpileMethod( 'amd' );
export const toCjs = transpileMethod( 'cjs' );
export const toUmd = transpileMethod( 'umd' );

export function bundle ( options ) {
	if ( !alreadyWarned.bundle ) {
		console.error( deprecateMessages.bundle );
		alreadyWarned.bundle = true;
	}

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
			if ( 'defaultOnly' in options && !alreadyWarned.defaultOnly ) {
				// TODO link to a wiki page explaining this, or something
				console.error( deprecateMessages.defaultOnly );
				alreadyWarned.defaultOnly = true;
			}

			let builder;

			if ( !options.strict ) {
				// ensure there are no named imports/exports
				if ( hasNamedExports( bundle.entryModule ) ) {
					throw new Error( 'Entry module can only have named exports in strict mode (pass `strict: true`)' );
				}

				bundle.modules.forEach( mod => {
					mod.imports.forEach( x => {
						if ( x.module.isExternal && ( !x.isDefault && !x.isBatch ) ) {
							throw new Error( 'You can only have named external imports in strict mode (pass `strict: true`)' );
						}
					});
				});

				builder = bundleBuilders.defaultsMode[ format ];
			} else {
				builder = bundleBuilders.strictMode[ format ];
			}

			return builder( bundle, options );
		}
	});
}

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
			flattened.push.apply( flattened, x.specifiers.map( x => x.as ) );
		}
	});

	return flattened;
}
