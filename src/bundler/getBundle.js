import path from 'path';
import hasOwnProp from 'utils/hasOwnProp';
import resolveId from 'utils/resolveId';
import sortModules from './utils/sortModules';
import resolveChains from './utils/resolveChains';
import combine from './combine';
import sander from 'sander';
import getModule from './getModule';

const Promise = sander.Promise;

export default function getBundle ( options ) {
	let entry = options.entry.replace( /\.js$/, '' );
	let userModules = options.modules || {};
	let modules = [];
	let moduleLookup = {};
	let promiseByPath = {};
	let skip = options.skip;
	let names = options.names;
	let base = ( options.base ? path.resolve( options.base ) : process.cwd() ) + '/';
	let externalModules = [];
	let externalModuleLookup = {};

	if ( !entry.indexOf( base ) ) {
		entry = entry.substring( base.length );
	}

	// resolve user module paths
	options.modules && Object.keys( options.modules ).forEach( relativePath => {
		userModules[ path.resolve( base, relativePath ) ] = options.modules[ relativePath ];
	});

	return resolvePath( base, userModules, entry, null ).then( absolutePath => {
		return fetchModule( entry, absolutePath ).then( () => {
			let entryModule = moduleLookup[ entry ];
			modules = sortModules( entryModule, moduleLookup );

			let bundle = {
				entry,
				entryModule,
				base,
				modules,
				moduleLookup,
				externalModules,
				externalModuleLookup,
				skip,
				names,
				chains: resolveChains( modules, moduleLookup )
			};

			combine( bundle );

			return bundle;
		});
	}, function ( err ) {
		if ( err.code === 'ENOENT' ) {
			throw new Error( 'Could not find entry module (' + entry + ')' );
		}

		throw err;
	});

	function fetchModule ( moduleId, absolutePath ) {
		if ( !hasOwnProp.call( promiseByPath, absolutePath ) ) {
			promiseByPath[ absolutePath ] = (
				hasOwnProp.call( userModules, absolutePath ) ?
					Promise.resolve( userModules[ absolutePath ] ) :
					sander.readFile( absolutePath ).then( String )
			).then( function ( source ) {
				let code, ast;

				// normalise
				if ( typeof source === 'object' ) {
					code = source.code;
					ast = source.ast;
				} else {
					code = source;
					ast = null;
				}

				if ( options.transform ) {
					code = options.transform( code, absolutePath );

					if ( typeof code !== 'string' && !isThenable( code ) ) {
						throw new Error( 'transform should return String or Promise' );
					}
				}

				let module = getModule({
					id: moduleId,
					path: absolutePath,
					code,
					ast,

					// TODO should not need this
					relativePath: path.relative( base, absolutePath )
				});

				modules.push( module );
				moduleLookup[ moduleId ] = module;

				let promises = module.imports.map( x => {
					x.id = resolveId( x.path, module.relativePath );

					if ( x.id === moduleId ) {
						throw new Error( 'A module (' + moduleId + ') cannot import itself' );
					}

					// Some modules can be skipped
					if ( skip && ~skip.indexOf( x.id ) ) {
						return;
					}

					return resolvePath( base, userModules, x.id, absolutePath, options.resolvePath ).then( absolutePath => {
						// short-circuit cycles
						if ( hasOwnProp.call( promiseByPath, absolutePath ) ) {
							return;
						}

						return fetchModule( x.id, absolutePath );
					}, function handleError ( err ) {
						if ( err.code === 'ENOENT' ) {
							// Most likely an external module
							if ( !hasOwnProp.call( externalModuleLookup, x.id ) ) {
								let externalModule = {
									id: x.id
								};

								externalModules.push( externalModule );
								externalModuleLookup[ x.id ] = externalModule;
							}
						} else {
							throw err;
						}
					} );
				});

				return Promise.all( promises );
			});
		}

		return promiseByPath[ absolutePath ];
	}
}

function resolvePath ( base, userModules, moduleId, importerPath, resolver ) {
	const noExt = moduleId.replace( /\.js$/, '' );

	return tryPath( base, noExt + '.js', userModules )
		.catch( () => tryPath( base, noExt + path.sep + 'index.js', userModules ) )
		.catch( function ( err ) {
			const resolvedPromise = resolver && Promise.resolve( resolver( moduleId, importerPath ) );

			if ( resolvedPromise ) {
				return resolvedPromise.then( resolvedPath => {
					if ( !resolvedPath ) {
						// hack but whatevs, it saves handling real ENOENTs differently
						let err = new Error();
						err.code = 'ENOENT';
						throw err;
					}

					return sander.stat( resolvedPath ).then( () => path.resolve( base, resolvedPath ) );
				});
			} else {
				throw err;
			}
		});
}

function tryPath ( base, filename, userModules ) {
	const absolutePath = path.resolve( base, filename );

	if ( hasOwnProp.call( userModules, absolutePath ) ) {
		return Promise.resolve( absolutePath );
	}
	return sander.stat( absolutePath ).then( () => absolutePath );
}

function isThenable ( obj ) {
	return obj && typeof obj.then === 'function';
}
