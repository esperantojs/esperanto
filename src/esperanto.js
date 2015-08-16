import { rollup } from 'rollup';
import { dirname, resolve } from 'path';
import { statSync } from 'fs';
import chalk from 'chalk';
import hasNamedImports from 'utils/hasNamedImports';
import hasNamedExports from 'utils/hasNamedExports';
import getStandaloneModule from 'standalone/getModule';
import moduleBuilders from 'standalone/builders';
import { getName } from 'utils/mappers';

let deprecateMessages = {
	defaultOnly: 'options.defaultOnly has been deprecated, and is now standard behaviour. To use named imports/exports, pass `strict: true`.',
	standalone: chalk.red.bold( '[DEPRECATION NOTICE] Esperanto is no longer under active development. To convert an ES6 module to another format, consider using Babel (https://babeljs.io)' ),
	bundle: chalk.red.bold( '[DEPRECATION NOTICE] Esperanto is no longer under active development. To bundle ES6 modules, consider using Rollup (https://github.com/rollup/rollup)' )
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
	if ( options.skip ) {
		throw new Error( 'options.skip is no longer supported' );
	}

	if ( !alreadyWarned.bundle ) {
		console.error( deprecateMessages.bundle );
		alreadyWarned.bundle = true;
	}

	const base = options.base || process.cwd();
	const entry = resolve( base, options.entry ).replace( /\.js$/, '' ) + '.js';

	let resolvedModules = {};
	if ( options.modules ) {
		Object.keys( options.modules ).forEach( file => {
			resolvedModules[ resolve( base, file ) ] = options.modules[ file ];
		});
	}

	return rollup({
		entry,

		resolveId ( importee, importer ) {
			const noExt = importee.replace( /\.js$/, '' );
			let resolved;

			if ( importee[0] === '.' ) {
				const dir = dirname( importer );
				resolved = resolve( dir, noExt + '.js' );
				if ( resolved in resolvedModules ) return resolved;

				try {
					statSync( resolved );
					return resolved;
				} catch ( err ) {}

				resolved = resolve( dir, noExt + '/index.js' );
				if ( resolved in resolvedModules ) return resolved;

				try {
					statSync( resolved );
					return resolved;
				} catch ( err ) {}

				throw new Error( `Could not resolve ${importee} from ${importer}` );
			}

			resolved = resolve( base, noExt + '.js' );
			if ( resolved in resolvedModules ) return resolved;

			try {
				statSync( resolved );
				return resolved;
			} catch ( err ) {}

			resolved = resolve( base, noExt + '/index.js' );
			if ( resolved in resolvedModules ) return resolved;

			try {
				statSync( resolved );
				return resolved;
			} catch ( err ) {}

			if ( options.resolvePath ) {
				return options.resolvePath( importee, importer );
			}

			return null;
		},

		load ( id ) {
			if ( id in resolvedModules ) return resolvedModules[ id ];
			var source = fs.readFileSync( id, 'utf-8' );

			return options.transform ?
				options.transform( source ) :
				source;
		}
	}).then( bundle => {
		function transpile ( format, bundleOptions ) {
			if ( 'defaultOnly' in options && !alreadyWarned.defaultOnly ) {
				// TODO link to a wiki page explaining this, or something
				console.error( deprecateMessages.defaultOnly );
				alreadyWarned.defaultOnly = true;
			}

			const result = bundle.generate({
				format,
				banner: bundleOptions.banner ? bundleOptions.banner.replace( /\n$/, '' ) : null,
				footer: bundleOptions.footer ? bundleOptions.footer.replace( /^\n/, '' ) : null,
				moduleName: bundleOptions.name,
				moduleId: bundleOptions.amdName,
				globals: options.names,
				exports: bundle.exports.length ? ( bundleOptions.strict ? 'named' : 'default' ) : 'none',
				useStrict: bundleOptions.useStrict,
				sourceMap: bundleOptions.sourceMap,
				sourceMapFile: bundleOptions.sourceMapFile
			});

			if ( bundleOptions.sourceMap === 'inline' ) {
				result.code += '\n//# sourceMappingURL=' + result.map.toUrl();
				result.map = null;
			}

			return result;
		}

		return {
			imports: bundle.imports,
			exports: bundle.exports,

			toAmd: options => transpile( 'amd', options ),
			toCjs: options => transpile( 'cjs', options ),
			toUmd: options => transpile( 'umd', options ),

			concat: options => transpile( 'iife', options )
		};
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
