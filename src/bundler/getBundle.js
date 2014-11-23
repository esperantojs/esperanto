import path from 'path';
import sortModules from './utils/sortModules';
import resolveChains from './utils/resolveChains';
import getUniqueNames from './utils/getUniqueNames';
import combine from './combine';
import sander from 'sander';
import getModule from './getModule';
import resolve from '../utils/resolve';

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

	return fetchModule( entry )
		.then( () => {
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
				uniqueNames: getUniqueNames( modules, options.names ),
				chains: resolveChains( modules, moduleLookup )
			};

			combine( bundle );

			return bundle;
		});

	function fetchModule ( modulePath ) {
		var moduleId = modulePath.replace( /\.js$/, '' );

		if ( !moduleId.indexOf( base ) ) {
			moduleId = moduleId.substring( base.length );
		}

		modulePath = moduleId + '.js';

		if ( !promiseById[ moduleId ] ) {
			promiseById[ moduleId ] = sander.readFile( base, modulePath ).catch( function ( err ) {
				if ( err.code === 'ENOENT' ) {
					modulePath = modulePath.replace( /\.js$/, '/index.js' );
					return sander.readFile( base, modulePath );
				}

				throw err;
			}).then( String ).then( function ( source ) {
				var module, promises;

				module = getModule({
					source: source,
					id: moduleId,
					file: modulePath
				});

				modules.push( module );
				moduleLookup[ moduleId ] = module;

				promises = module.imports.map( x => {
					var importId;

					importId = resolve( x.path, modulePath );

					// Some modules can be skipped
					if ( skip && ~skip.indexOf( importId ) ) {
						return;
					}

					// short-circuit cycles
					if ( promiseById[ importId ] ) {
						return;
					}

					return fetchModule( importId );
				});

				return Promise.all( promises );
			}).catch( function ( err ) {
				var externalModule;

				if ( err.code === 'ENOENT' ) {
					if ( moduleId === entry ) {
						throw new Error( 'Could not find entry module (' + entry + ')' );
					}

					// Most likely an external module
					if ( !externalModuleLookup[ moduleId ] ) {
						externalModule = {
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
