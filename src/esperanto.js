import getStandaloneModule from './standalone/getModule';
import getBundle from './bundler/getBundle';
import moduleBuilders from './standalone/builders';
import bundleBuilders from './bundler/builders';
import hasNamedImports from './utils/hasNamedImports';
import hasNamedExports from './utils/hasNamedExports';
import annotateAst from './utils/annotateAst';

var deprecateMessage = 'options.defaultOnly has been deprecated, and is now standard behaviour. To use named imports/exports, pass `strict: true`.';

function transpileMethod ( format ) {
	return function ( source, options ) {
		var module,
			body,
			builder;

		options = options || {};
		module = getStandaloneModule({ source: source, getModuleName: options.getModuleName });
		body = module.body.clone();

		if ( 'defaultOnly' in options ) {
			// TODO link to a wiki page explaining this, or something
			console.log( deprecateMessage );
		}

		if ( !options.strict ) {
			// ensure there are no named imports/exports. TODO link to a wiki page...
			if ( hasNamedImports( module ) || hasNamedExports( module ) ) {
				throw new Error( 'You must be in strict mode (pass `strict: true`) to use named imports or exports' );
			}

			builder = moduleBuilders.defaultsMode[ format ];
		} else {
			// annotate AST with scope info
			annotateAst( module.ast );
			builder = moduleBuilders.strictMode[ format ];
		}

		return builder( module, body, options );
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

				if ( 'defaultOnly' in options ) {
					// TODO link to a wiki page explaining this, or something
					console.log( deprecateMessage );
				}

				if ( !options.strict ) {
					// ensure there are no named imports/exports
					if ( hasNamedExports( bundle.entryModule ) ) {
						throw new Error( 'Entry module can only have named exports in strict mode (pass `strict: true`)' );
					}

					builder = bundleBuilders.defaultsMode[ format ];
				} else {
					builder = bundleBuilders.strictMode[ format ];
				}

				return builder( bundle, bundle.body.clone(), options );
			}
		});
	}
};
