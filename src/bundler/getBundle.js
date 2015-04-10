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

	return resolvePath( base, userModules, entry, null ).then( relativePath => {
		return fetchModule( entry, relativePath ).then( () => {
			let entryModule = moduleLookup[ entry ];
			modules = sortModules( entryModule, moduleLookup ); // TODO is this necessary? surely it's already sorted because of the fetch order? or do we need to prevent parallel reads?

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

	function fetchModule ( moduleId, relativePath ) {
		let absolutePath = path.resolve( base, relativePath );

		if ( !hasOwnProp.call( promiseByPath, relativePath ) ) {
			promiseByPath[ relativePath ] = (
				hasOwnProp.call( userModules, relativePath ) ?
					Promise.resolve( userModules[ relativePath ] ) :
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
					relativePath
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

					return resolvePath( base, userModules, x.id, absolutePath, options.resolvePath ).then( relativePath => {
						// short-circuit cycles
						if ( hasOwnProp.call( promiseByPath, relativePath ) ) {
							return;
						}

						return fetchModule( x.id, relativePath );
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

		return promiseByPath[ relativePath ];
	}
}

function resolvePath ( base, userModules, moduleId, importerPath, resolver ) {
	return tryPath( base, moduleId + '.js', userModules )
		.catch( () => tryPath( base, moduleId + path.sep + 'index.js', userModules ) )
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

					return sander.stat( resolvedPath ).then( () => resolvedPath );
				});
			} else {
				throw err;
			}
		});
}

function tryPath ( base, filename, userModules ) {
	if ( hasOwnProp.call( userModules, filename ) ) {
		return Promise.resolve( filename );
	}
	return sander.stat( base, filename ).then( () => filename );
}

function isThenable ( obj ) {
	return obj && typeof obj.then === 'function';
}
