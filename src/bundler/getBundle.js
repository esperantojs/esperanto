import path from 'path';
import hasOwnProp from 'utils/hasOwnProp';
import resolveId from 'utils/resolveId';
import sortModules from './utils/sortModules';
import resolveChains from './utils/resolveChains';
import combine from './combine';
import sander from 'sander';
import getModule from './getModule';

var Promise = sander.Promise;

export default function getBundle ( options ) {
	var entry = options.entry.replace( /\.js$/, '' ),
		modules = [],
		moduleLookup = {},
		promiseById = {},
		skip = options.skip,
		names = options.names,
		base = ( options.base ? path.resolve( options.base ) : process.cwd() ) + '/',
		externalModules = [],
		externalModuleLookup = {};

	if ( !entry.indexOf( base ) ) {
		entry = entry.substring( base.length );
	}

	return fetchModule( entry, null ).then( () => {
		var entryModule, bundle;

		entryModule = moduleLookup[ entry ];
		modules = sortModules( entryModule, moduleLookup ); // TODO is this necessary? surely it's already sorted because of the fetch order? or do we need to prevent parallel reads?

		bundle = {
			entry: entry,
			entryModule: entryModule,
			base: base,
			modules: modules,
			moduleLookup: moduleLookup,
			externalModules: externalModules,
			externalModuleLookup: externalModuleLookup,
			skip: skip,
			names: names,
			chains: resolveChains( modules, moduleLookup )
		};

		combine( bundle );

		return bundle;
	});

	function fetchModule ( moduleId, importerPath ) {
		if ( !hasOwnProp.call( promiseById, moduleId ) ) {
			promiseById[ moduleId ] = resolvePath( base, moduleId, importerPath, options.resolvePath ).then( modulePath => {
				return sander.readFile( modulePath ).then( String ).then( function ( source ) {
					var module, promises;

					if ( options.transform ) {
						source = options.transform( source, modulePath );

						if ( typeof source !== 'string' && !isThenable( source ) ) {
							throw new Error( 'transform should return String or Promise' );
						}
					}

					module = getModule({
						source: source,
						id: moduleId,
						file: modulePath.substring( base.length ),
						path: modulePath
					});

					modules.push( module );
					moduleLookup[ moduleId ] = module;

					promises = module.imports.map( x => {
						x.id = resolveId( x.path, module.file );

						if ( x.id === moduleId ) {
							throw new Error( 'A module (' + moduleId + ') cannot import itself' );
						}

						// Some modules can be skipped
						if ( skip && ~skip.indexOf( x.id ) ) {
							return;
						}

						// short-circuit cycles
						if ( hasOwnProp.call( promiseById, x.id ) ) {
							return;
						}

						return fetchModule( x.id, modulePath );
					});

					return Promise.all( promises );
				});
			}, function ( err ) {
				if ( err.code === 'ENOENT' ) {
					if ( moduleId === entry ) {
						throw new Error( 'Could not find entry module (' + entry + ')' );
					}

					// Most likely an external module
					if ( !hasOwnProp.call( externalModuleLookup, moduleId ) ) {
						let externalModule = {
							id: moduleId
						};

						externalModules.push( externalModule );
						externalModuleLookup[ moduleId ] = externalModule;
					}
				} else {
					throw err;
				}
			});
		}

		return promiseById[ moduleId ];
	}
}

function resolvePath ( base, moduleId, importerPath, resolver ) {
	return tryPath( base + moduleId + '.js' )
		.catch( function () {
			return tryPath( base + moduleId + path.sep + 'index.js' );
		})
		.catch( function ( err ) {
			if ( resolver ) {
				return resolver( moduleId, importerPath );
			} else {
				throw err;
			}
		});
}

function tryPath ( path ) {
	return sander.stat( path ).then( function () {
		return path;
	});
}

function isThenable ( obj ) {
	return obj && typeof obj.then === 'function';
}
