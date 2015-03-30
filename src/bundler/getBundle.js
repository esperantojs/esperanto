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

	return resolvePath( base, entry, null ).then( entryPath => {
		return fetchModule( entry, entryPath ).then( () => {
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

	function fetchModule ( moduleId, modulePath ) {
		if ( !hasOwnProp.call( promiseByPath, modulePath ) ) {
			promiseByPath[ modulePath ] = sander.readFile( modulePath ).then( String ).then( function ( source ) {
				var module, promises;

				if ( options.transform ) {
					source = options.transform( source, modulePath );

					if ( typeof source !== 'string' && !isThenable( source ) ) {
						throw new Error( 'transform should return String or Promise' );
					}
				}

				module = getModule({
					source,
					id: moduleId,
					relativePath: path.relative( base, modulePath ),
					path: modulePath
				});

				modules.push( module );
				moduleLookup[ moduleId ] = module;

				promises = module.imports.map( x => {
					x.id = resolveId( x.path, module.relativePath );

					if ( x.id === moduleId ) {
						throw new Error( 'A module (' + moduleId + ') cannot import itself' );
					}

					// Some modules can be skipped
					if ( skip && ~skip.indexOf( x.id ) ) {
						return;
					}

					return resolvePath( base, x.id, modulePath, options.resolvePath ).then( modulePath => {
						// short-circuit cycles
						if ( hasOwnProp.call( promiseByPath, modulePath ) ) {
							return;
						}

						return fetchModule( x.id, modulePath );
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

		return promiseByPath[ modulePath ];
	}
}

function resolvePath ( base, moduleId, importerPath, resolver ) {
	return tryPath( path.resolve( base, moduleId + '.js' ) )
		.catch( () => tryPath( path.resolve( base, moduleId, 'index.js' ) ) )
		.catch( function ( err ) {
			if ( resolver ) {
				return resolver( moduleId, importerPath );
			} else {
				throw err;
			}
		});
}

function tryPath ( path ) {
	return sander.stat( path ).then( () => path );
}

function isThenable ( obj ) {
	return obj && typeof obj.then === 'function';
}
