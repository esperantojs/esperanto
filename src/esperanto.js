import hasOwnProp from 'utils/hasOwnProp';
import getStandaloneModule from './standalone/getModule';
import getBundle from './bundler/getBundle';
import moduleBuilders from './standalone/builders';
import bundleBuilders from './bundler/builders';
import hasNamedImports from './utils/hasNamedImports';
import hasNamedExports from './utils/hasNamedExports';

var deprecateMessage = 'options.defaultOnly has been deprecated, and is now standard behaviour. To use named imports/exports, pass `strict: true`.',
	alreadyWarned = false;

function transpileMethod ( format ) {
	return function ( source, options = {} ) {
		var mod,
			body,
			builder;

		mod = getStandaloneModule({ source: source, getModuleName: options.getModuleName, strict: options.strict });
		body = mod.body.clone();

		if ( 'defaultOnly' in options && !alreadyWarned ) {
			// TODO link to a wiki page explaining this, or something
			console.log( deprecateMessage );
			alreadyWarned = true;
		}

		if ( !options.strict ) {
			// ensure there are no named imports/exports. TODO link to a wiki page...
			if ( hasNamedImports( mod ) || hasNamedExports( mod ) ) {
				throw new Error( 'You must be in strict mode (pass `strict: true`) to use named imports or exports' );
			}

			builder = moduleBuilders.defaultsMode[ format ];
		} else {
			builder = moduleBuilders.strictMode[ format ];
		}

		return builder( mod, body, options );
	};
}

export default {
	toAmd: transpileMethod( 'amd' ),
	toCjs: transpileMethod( 'cjs' ),
	toUmd: transpileMethod( 'umd' ),

	bundle: function ( options ) {
		return getBundle( options ).then( function ( bundle ) {
			return {
				toAmd: options => transpile( 'amd', options ),
				toCjs: options => transpile( 'cjs', options ),
				toUmd: options => transpile( 'umd', options )
			};

			function transpile ( format, options ) {
				var builder;

				options = options || {};

				if ( 'defaultOnly' in options && !alreadyWarned ) {
					// TODO link to a wiki page explaining this, or something
					console.log( deprecateMessage );
					alreadyWarned = true;
				}

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

				return builder( bundle, bundle.body.clone(), options );
			}
		});
	}
};
