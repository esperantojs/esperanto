/*
	esperanto.js v0.7.5 - 2015-08-16
	http://esperantojs.org

	Released under the MIT License.
*/

(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('graceful-fs'), require('es6-promise'), require('path'), require('mkdirp'), require('rimraf'), require('acorn'), require('fs'), require('chalk')) :
	typeof define === 'function' && define.amd ? define(['exports', 'graceful-fs', 'es6-promise', 'path', 'mkdirp', 'rimraf', 'acorn', 'fs', 'chalk'], factory) :
	factory((global.esperanto = {}), global.graceful_fs, global.es6_promise, global._path, global.mkdirp, global._rimraf, global.acorn, global.fs, global.chalk)
}(this, function (exports, graceful_fs, es6_promise, _path, mkdirp, _rimraf, acorn, fs, chalk) { 'use strict';

	mkdirp = ('default' in mkdirp ? mkdirp['default'] : mkdirp);
	_rimraf = ('default' in _rimraf ? _rimraf['default'] : _rimraf);
	chalk = ('default' in chalk ? chalk['default'] : chalk);

	// TODO does this all work on windows?

	const absolutePath = /^(?:\/|(?:[A-Za-z]:)?\\)/;

	function isAbsolute ( path ) {
		return absolutePath.test( path );
	}

	function basename ( path ) {
		return path.split( /(\/|\\)/ ).pop();
	}

	function dirname ( path ) {
		const match = /(\/|\\)[^\/\\]*$/.exec( path );
		if ( !match ) return '.';

		const dir = path.slice( 0, -match[0].length );

		// If `dir` is the empty string, we're at root.
		return dir ? dir : '/';
	}

	function extname ( path ) {
		const match = /\.[^\.]+$/.exec( path );
		if ( !match ) return '';
		return match[0];
	}

	function relative ( from, to ) {
		const fromParts = from.split( /[\/\\]/ ).filter( Boolean );
		const toParts = to.split( /[\/\\]/ ).filter( Boolean );

		while ( fromParts[0] && toParts[0] && fromParts[0] === toParts[0] ) {
			fromParts.shift();
			toParts.shift();
		}

		while ( toParts[0] && toParts[0][0] === '.' ) {
			const toPart = toParts.shift();
			if ( toPart === '..' ) {
				fromParts.pop();
			} else if ( toPart !== '.' ) {
				throw new Error( `Unexpected path part (${toPart})` );
			}
		}

		while ( fromParts.pop() ) {
			toParts.unshift( '..' );
		}

		return toParts.join( '/' );
	}

	function resolve ( ...paths ) {
		let resolvedParts = paths.shift().split( /[\/\\]/ );

		paths.forEach( path => {
			if ( isAbsolute( path ) ) {
				resolvedParts = path.split( /[\/\\]/ );
			} else {
				const parts = path.split( /[\/\\]/ );

				while ( parts[0] && parts[0][0] === '.' ) {
					const part = parts.shift();
					if ( part === '..' ) {
						resolvedParts.pop();
					} else if ( part !== '.' ) {
						throw new Error( `Unexpected path part (${part})` );
					}
				}

				resolvedParts.push.apply( resolvedParts, parts );
			}
		});

		return resolvedParts.join( '/' ); // TODO windows...
	}

	function resolvePath ( args ) {
		return _path.resolve.apply( null, args );
	}

	function standardMethod__normaliseArguments ( args ) {
		const len = args.length;

		let buildingPath = true;
		let pathargs = [];
		let normalised = [ null ]; // null is a placeholder for the resolved path
		let i;

		for ( i = 0; i < len; i += 1 ) {
			if ( buildingPath && typeof args[i] === 'string' ) {
				pathargs[i] = args[i];
			} else {
				buildingPath = false;
				normalised.push( args[i] );
			}
		}

		normalised[0] = resolvePath( pathargs );

		return normalised;
	}

	function standardMethod__asyncMethod ( methodName ) {
		return function () {
			const args = standardMethod__normaliseArguments( arguments );

			return new Promise( ( fulfil, reject ) => {
				args.push( ( err, result ) => {
					if ( err ) {
						reject( err );
					} else {
						fulfil( result );
					}
				});

				graceful_fs[ methodName ].apply( graceful_fs, args );
			});
		};
	}

	function standardMethod__syncMethod ( methodName ) {
		return function () {
			const args = standardMethod__normaliseArguments( arguments );
			return graceful_fs[ methodName ].apply( graceful_fs, args );
		};
	}

	function asyncFileDescriptorMethod ( methodName ) {
		return function () {
			let args = [];
			let i = arguments.length;

			while ( i-- ) {
				args[i] = arguments[i];
			}

			return new Promise( ( fulfil, reject ) => {
				args.push( ( err, result ) => {
					if ( err ) {
						reject( err );
					} else {
						fulfil( result );
					}
				});

				graceful_fs[ methodName ].apply( graceful_fs, args );
			});
		};
	}

	function resolvePathAndOptions ( args ) {
		let options;
		let pathargs;

		if ( typeof args[ args.length - 1 ] === 'object' ) {
			options = args[ args.length - 1 ];

			let i = args.length - 1;
			pathargs = new Array( i );

			while ( i-- ) {
				pathargs[i] = args[i];
			}
		} else {
			options = {};
			pathargs = args;
		}

		const resolvedPath = _path.resolve.apply( null, pathargs );

		return { options, resolvedPath };
	}

	function createReadStream_createWriteStream__createReadStream () {
		const { resolvedPath, options } = resolvePathAndOptions( arguments );
		return graceful_fs.createReadStream( resolvedPath, options );
	}

	function createReadStream_createWriteStream__createWriteStream () {
		const { resolvedPath, options } = resolvePathAndOptions( arguments );

		mkdirp.sync( _path.dirname( resolvedPath ) );
		return graceful_fs.createWriteStream( resolvedPath, options );
	}

	function exists () {
		const target = resolvePath( arguments );

		return new Promise( fulfil => {
			graceful_fs.exists( target, exists => fulfil( exists ) );
		});
	}

	function existsSync () {
		return graceful_fs.existsSync( resolvePath( arguments ) );
	}

	const link_rename__rename = link_rename__asyncMethod( 'rename' );
	const link = link_rename__asyncMethod( 'link' );

	const renameSync = link_rename__syncMethod( 'renameSync' );
	const linkSync = link_rename__syncMethod( 'linkSync' );

	function link_rename__asyncMethod ( methodName ) {
		return function () {
			const src = resolvePath( arguments );

			return {
				to () {
					const dest = resolvePath( arguments );

					return new Promise( ( fulfil, reject ) => {
						mkdirp( _path.dirname( dest ), err => {
							if ( err ) {
								reject( err );
							} else {
								graceful_fs[ methodName ]( src, dest, err => {
									if ( err ) {
										reject( err );
									} else {
										fulfil();
									}
								});
							}
						});
					});
				}
			};
		};
	}

	function link_rename__syncMethod ( methodName ) {
		return function () {
			const src = resolvePath( arguments );

			return {
				to () {
					const dest = resolvePath( arguments );

					mkdirp.sync( _path.dirname( dest ) );
					return graceful_fs[ methodName ]( src, dest );
				}
			};
		};
	}

	function mkdir () {
		const dir = resolvePath( arguments );

		return new Promise( ( fulfil, reject ) => {
			mkdirp( dir, err => {
				if ( err ) {
					reject( err );
				} else {
					fulfil();
				}
			});
		});
	}

	function mkdirSync () {
		const dir = resolvePath( arguments );
		mkdirp.sync( dir );
	}

	function specialMethods_open__normaliseArguments ( args ) {
		let options;
		let flags;
		let i;

		if ( typeof args[ args.length - 1 ] === 'object' ) {
			options = args[ args.length - 1 ];
			flags = args[ args.length - 2 ];
			i = args.length - 2;
		} else {
			options = {};
			flags = args[ args.length - 1 ];
			i = args.length - 1;
		}

		let pathargs = new Array( i );
		while ( i-- ) {
			pathargs[i] = args[i];
		}

		const resolvedPath = resolvePath( pathargs );

		return { resolvedPath, options, flags };
	}

	function bailIfExists ( src, flags, mode ) {
		let alreadyExists;

		try {
			graceful_fs.statSync( src );
			alreadyExists = true;
		} catch ( err ) {
			if ( err.code !== 'ENOENT' ) {
				throw err;
			}
		}

		if ( alreadyExists ) {
			// attempt the operation = that way, we get the intended error message
			// TODO can't we just do this in the first place?
			graceful_fs.openSync( src, flags, mode );
		}
	}

	function open () {
		const { resolvedPath: src, options, flags } = specialMethods_open__normaliseArguments( arguments );

		if ( /^.x/.test( flags ) ) {
			bailIfExists( src, flags, options.mode );
		}

		return new Promise( ( fulfil, reject ) => {
			function open () {
				graceful_fs.open( src, flags, options.mode, ( err, fd ) => {
					if ( err ) {
						reject( err );
					} else {
						fulfil( fd );
					}
				});
			}

			// create dirs if necessary
			if ( /^[wa]/.test( flags ) ) {
				mkdirp( _path.dirname( src ), err => {
					if ( err ) {
						reject( err );
					} else {
						open();
					}
				});
			} else {
				open();
			}
		});
	}


	function openSync () {
		const { resolvedPath: src, options, flags } = specialMethods_open__normaliseArguments( arguments );

		if ( /^.x/.test( flags ) ) {
			bailIfExists( src, flags, options.mode );
		}

		// create dirs if necessary
		if ( /^[wa]/.test( flags ) ) {
			mkdirp.sync( _path.dirname( src ) );
		}

		return graceful_fs.openSync( src, flags, options.mode );
	}

	function symlink () {
		const src = resolvePath( arguments );

		return {
			to () {
				const { options, resolvedPath: dest } = resolvePathAndOptions( arguments );

				return new Promise( ( fulfil, reject ) => {
					mkdirp( _path.dirname( dest ), err => {
						if ( err ) {
							reject( err );
						} else {
							graceful_fs.symlink( src, dest, options.type, err => {
								if ( err ) {
									reject( err );
								} else {
									fulfil();
								}
							});
						}
					});
				});
			}
		};
	}

	function symlinkSync () {
		const src = resolvePath( arguments );

		return {
			to () {
				const { options, resolvedPath: dest } = resolvePathAndOptions( arguments );
				mkdirp.sync( _path.dirname( dest ) );
				return graceful_fs.symlinkSync( src, dest, options.type );
			}
		};
	}

	const writeFile = writeFile_appendFile__asyncMethod( 'writeFile' );
	const appendFile = writeFile_appendFile__asyncMethod( 'appendFile' );

	const writeFileSync = writeFile_appendFile__syncMethod( 'writeFileSync' );
	const appendFileSync = writeFile_appendFile__syncMethod( 'appendFileSync' );

	function writeFile_appendFile__normaliseArguments ( args ) {
		let i = args.length;
		const data = args[ --i ];

		let pathargs = new Array( i );

		while ( i-- ) {
			pathargs[i] = args[i];
		}

		const dest = resolvePath( pathargs );

		return { dest, data };
	}

	function writeFile_appendFile__asyncMethod ( methodName ) {
		return function () {
			const { dest, data } = writeFile_appendFile__normaliseArguments( arguments );

			return new Promise( ( fulfil, reject ) => {
				mkdirp( _path.dirname( dest ), err => {
					if ( err ) {
						reject( err );
					} else {
						graceful_fs[ methodName ]( dest, data, err => {
							if ( err ) {
								reject( err );
							} else {
								fulfil();
							}
						});
					}
				});
			});
		};
	}

	function writeFile_appendFile__syncMethod ( methodName ) {
		return function () {
			const { dest, data } = writeFile_appendFile__normaliseArguments( arguments );

			mkdirp.sync( _path.dirname( dest ) );
			return graceful_fs[ methodName ]( dest, data );
		};
	}

	function copydir () {
		const { resolvedPath: src, options: readOptions } = resolvePathAndOptions( arguments );

		return {
			to () {
				const { resolvedPath: dest, options: writeOptions } = resolvePathAndOptions( arguments );

				function copydir ( src, dest, cb ) {
					mkdirp( dest, err => {
						if ( err ) return cb( err );

						graceful_fs.readdir( src, ( err, files ) => {
							if ( err ) return cb( err );

							let remaining = files.length;

							if ( !remaining ) return cb();

							function check ( err ) {
								if ( err ) {
									return cb( err );
								}

								if ( !--remaining ) {
									cb();
								}
							}

							files.forEach( function ( filename ) {
								const srcpath = src + _path.sep + filename;
								const destpath = dest + _path.sep + filename;

								graceful_fs.stat( srcpath, ( err, stats ) => {
									var readStream, writeStream;

									if ( stats.isDirectory() ) {
										return copydir( srcpath, destpath, check );
									}

									readStream = graceful_fs.createReadStream( srcpath, readOptions );
									writeStream = graceful_fs.createWriteStream( destpath, writeOptions );

									readStream.on( 'error', cb );
									writeStream.on( 'error', cb );

									writeStream.on( 'close', check );

									readStream.pipe( writeStream );
								});
							});
						});
					});
				}

				return new Promise( ( fulfil, reject ) => {
					copydir( src, dest, err => {
						if ( err ) {
							reject( err );
						} else {
							fulfil();
						}
					});
				});
			}
		};
	}

	function copydirSync () {
		const { resolvedPath: src, options: readOptions } = resolvePathAndOptions( arguments );

		return {
			to () {
				const { resolvedPath: dest, options: writeOptions } = resolvePathAndOptions( arguments );

				function copydir ( src, dest ) {
					mkdirp.sync( dest );

					graceful_fs.readdirSync( src ).forEach( filename => {
						const srcpath = src + _path.sep + filename;
						const destpath = dest + _path.sep + filename;

						if ( graceful_fs.statSync( srcpath ).isDirectory() ) {
							return copydir( srcpath, destpath );
						}

						const data = graceful_fs.readFileSync( srcpath, readOptions );
						graceful_fs.writeFileSync( destpath, data, writeOptions );
					});
				}

				copydir( src, dest );
			}
		};
	}

	function copyFile () {
		const { resolvedPath: src, options: readOptions } = resolvePathAndOptions( arguments );

		return {
			to () {
				const { resolvedPath: dest, options: writeOptions } = resolvePathAndOptions( arguments );

				return new Promise( ( fulfil, reject ) => {
					mkdirp( _path.dirname( dest ), err => {
						if ( err ) {
							reject( err );
						} else {
							const readStream = graceful_fs.createReadStream( src, readOptions );
							const writeStream = graceful_fs.createWriteStream( dest, writeOptions );

							readStream.on( 'error', reject );
							writeStream.on( 'error', reject );

							writeStream.on( 'close', fulfil );

							readStream.pipe( writeStream );
						}
					});
				});
			}
		};
	}

	function copyFileSync () {
		const { resolvedPath: src, options: readOptions } = resolvePathAndOptions( arguments );

		return {
			to () {
				const { resolvedPath: dest, options: writeOptions } = resolvePathAndOptions( arguments );

				const data = graceful_fs.readFileSync( src, readOptions );

				mkdirp.sync( _path.dirname( dest ) );
				graceful_fs.writeFileSync( dest, data, writeOptions );
			}
		};
	}

	function lsr () {
		const basedir = resolvePath( arguments );

		let result = [];

		function processdir ( dir, cb ) {
			graceful_fs.readdir( dir, ( err, files ) => {
				if ( err ) {
					return cb( err );
				}

				let remaining = files.length;

				if ( !remaining ) {
					return cb();
				}

				files = files.map( file => dir + _path.sep + file );

				function check ( err ) {
					if ( err ) {
						cb( err );
					}

					else if ( !--remaining ) {
						cb();
					}
				}

				files.forEach( file => {
					graceful_fs.stat( file, ( err, stats ) => {
						if ( err ) {
							cb( err );
						} else {
							if ( stats.isDirectory() ) {
								processdir( file, check );
							} else {
								result.push( file.replace( basedir + _path.sep, '' ) );
								check();
							}
						}
					});
				});
			});
		}

		return new Promise( ( fulfil, reject ) => {
			processdir( basedir, err => {
				if ( err ) {
					reject( err );
				} else {
					fulfil( result );
				}
			});
		});
	}

	function lsrSync () {
		const basedir = resolvePath( arguments );

		let result = [];

		function processdir ( dir ) {
			graceful_fs.readdirSync( dir ).forEach( file => {
				const filepath = dir + _path.sep + file;

				if ( graceful_fs.statSync( filepath ).isDirectory() ) {
					processdir( filepath );
				} else {
					result.push( filepath.replace( basedir + _path.sep, '' ) );
				}
			});
		}

		processdir( basedir );
		return result;
	}

	function rimraf () {
		const target = resolvePath( arguments );

		return new Promise( ( fulfil, reject ) => {
			_rimraf( target, err => {
				if ( err ) {
					reject( err );
				} else {
					fulfil();
				}
			});
		});
	}

	function rimrafSync () {
		_rimraf.sync( resolvePath( arguments ) );
	}

	const isWindows = process.platform === 'win32';

	function symlinkOrCopy () {
		if ( isWindows ) {
			const { resolvedPath: src, options: readOptions } = resolvePathAndOptions( arguments );

			let copyDirOrFileTo = stat( src )
				.then( stats => {
					return ( stats.isDirectory() ? copydir : copyFile )
						.apply( null, arguments )
						.to;
				});

			return {
				to () {
					return copyDirOrFileTo
						.then(fn => {
							return fn.apply(null, arguments);
						});
				}
			};
		}

		return symlink.apply( null, arguments );
	}

	function symlinkOrCopySync () {
		if ( isWindows ) {
			const { resolvedPath: src, options: readOptions } = resolvePathAndOptions( arguments );
			return ( statSync( src ).isDirectory() ? copydirSync : copyFileSync ).apply( null, arguments );
		}

		return symlinkSync.apply( null, arguments );
	}

	const chmod = standardMethod__asyncMethod( 'chmod' );
	const chown = standardMethod__asyncMethod( 'chown' );
	const sander__createReadStream = standardMethod__asyncMethod( 'createReadStream' );
	const sander__createWriteStream = standardMethod__asyncMethod( 'createWriteStream' );
	const lchmod = standardMethod__asyncMethod( 'lchmod' );
	const lchown = standardMethod__asyncMethod( 'lchown' );
	const lstat = standardMethod__asyncMethod( 'lstat' );
	const readdir = standardMethod__asyncMethod( 'readdir' );
	const readFile = standardMethod__asyncMethod( 'readFile' );
	const readlink = standardMethod__asyncMethod( 'readlink' );
	const realpath = standardMethod__asyncMethod( 'realpath' );
	const rmdir = standardMethod__asyncMethod( 'rmdir' );
	const stat = standardMethod__asyncMethod( 'stat' );
	const truncate = standardMethod__asyncMethod( 'truncate' );
	const unlink = standardMethod__asyncMethod( 'unlink' );
	const utimes = standardMethod__asyncMethod( 'utimes' );
	const unwatchFile = standardMethod__asyncMethod( 'unwatchFile' );
	const watch = standardMethod__asyncMethod( 'watch' );
	const watchFile = standardMethod__asyncMethod( 'watchFile' );

	// standard sync methods
	const chmodSync = standardMethod__syncMethod( 'chmodSync' );
	const chownSync = standardMethod__syncMethod( 'chownSync' );
	const lchmodSync = standardMethod__syncMethod( 'lchmodSync' );
	const lchownSync = standardMethod__syncMethod( 'lchownSync' );
	const lstatSync = standardMethod__syncMethod( 'lstatSync' );
	const readdirSync = standardMethod__syncMethod( 'readdirSync' );
	const readFileSync = standardMethod__syncMethod( 'readFileSync' );
	const readlinkSync = standardMethod__syncMethod( 'readlinkSync' );
	const realpathSync = standardMethod__syncMethod( 'realpathSync' );
	const rmdirSync = standardMethod__syncMethod( 'rmdirSync' );
	const statSync = standardMethod__syncMethod( 'statSync' );
	const truncateSync = standardMethod__syncMethod( 'truncateSync' );
	const unlinkSync = standardMethod__syncMethod( 'unlinkSync' );
	const utimesSync = standardMethod__syncMethod( 'utimesSync' );

	// file descriptor async methods
	const close = asyncFileDescriptorMethod( 'close' );
	const fchmod = asyncFileDescriptorMethod( 'fchmod' );
	const fchown = asyncFileDescriptorMethod( 'fchown' );
	const fstat = asyncFileDescriptorMethod( 'fstat' );
	const fsync = asyncFileDescriptorMethod( 'fsync' );
	const ftruncate = asyncFileDescriptorMethod( 'ftruncate' );
	const futimes = asyncFileDescriptorMethod( 'futimes' );
	const read = asyncFileDescriptorMethod( 'read' );

	// file descriptor sync methods
	const closeSync = graceful_fs.closeSync;
	const fchmodSync = graceful_fs.fchmodSync;
	const fchownSync = graceful_fs.fchownSync;
	const fstatSync = graceful_fs.fstatSync;
	const fsyncSync = graceful_fs.fsyncSync;
	const ftruncateSync = graceful_fs.ftruncateSync;
	const futimesSync = graceful_fs.futimesSync;
	const readSync = graceful_fs.readSync;

	// special methods
	const sander__Promise = es6_promise.Promise;

	const object__keys = Object.keys;

	function object__blank () {
		return Object.create( null );
	}

	var _btoa;

	if ( typeof window !== 'undefined' && typeof window.btoa === 'function' ) {
		_btoa = window.btoa;
	} else if ( typeof Buffer === 'function' ) {
		_btoa = str => new Buffer( str ).toString( 'base64' );
	} else {
		throw new Error( 'Unsupported environment: `window.btoa` or `Buffer` should be supported.' );
	}

	var btoa = _btoa;

	class SourceMap {
		constructor ( properties ) {
			this.version = 3;

			this.file           = properties.file;
			this.sources        = properties.sources;
			this.sourcesContent = properties.sourcesContent;
			this.names          = properties.names;
			this.mappings       = properties.mappings;
		}

		toString () {
			return JSON.stringify( this );
		}

		toUrl () {
			return 'data:application/json;charset=utf-8;base64,' + btoa( this.toString() );
		}
	}

	function guessIndent ( code ) {
		const lines = code.split( '\n' );

		const tabbed = lines.filter( line => /^\t+/.test( line ) );
		const spaced = lines.filter( line => /^ {2,}/.test( line ) );

		if ( tabbed.length === 0 && spaced.length === 0 ) {
			return null;
		}

		// More lines tabbed than spaced? Assume tabs, and
		// default to tabs in the case of a tie (or nothing
		// to go on)
		if ( tabbed.length >= spaced.length ) {
			return '\t';
		}

		// Otherwise, we need to guess the multiple
		const min = spaced.reduce( ( previous, current ) => {
			var numSpaces = /^ +/.exec( current )[0].length;
			return Math.min( numSpaces, previous );
		}, Infinity );

		return new Array( min + 1 ).join( ' ' );
	}

	var charToInteger = {};
	var integerToChar = {};

	'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/='.split( '' ).forEach( function ( char, i ) {
		charToInteger[ char ] = i;
		integerToChar[ i ] = char;
	});

	function decode ( string ) {
		var result = [],
			len = string.length,
			i,
			hasContinuationBit,
			shift = 0,
			value = 0,
			integer,
			shouldNegate;

		for ( i = 0; i < len; i += 1 ) {
			integer = charToInteger[ string[i] ];

			if ( integer === undefined ) {
				throw new Error( 'Invalid character (' + string[i] + ')' );
			}

			hasContinuationBit = integer & 32;

			integer &= 31;
			value += integer << shift;

			if ( hasContinuationBit ) {
				shift += 5;
			} else {
				shouldNegate = value & 1;
				value >>= 1;

				result.push( shouldNegate ? -value : value );

				// reset
				value = shift = 0;
			}
		}

		return result;
	}

	function encode ( value ) {
		var result, i;

		if ( typeof value === 'number' ) {
			result = encodeInteger( value );
		} else {
			result = '';
			for ( i = 0; i < value.length; i += 1 ) {
				result += encodeInteger( value[i] );
			}
		}

		return result;
	}

	function encodeInteger ( num ) {
		var result = '', clamped;

		if ( num < 0 ) {
			num = ( -num << 1 ) | 1;
		} else {
			num <<= 1;
		}

		do {
			clamped = num & 31;
			num >>= 5;

			if ( num > 0 ) {
				clamped |= 32;
			}

			result += integerToChar[ clamped ];
		} while ( num > 0 );

		return result;
	}

	function encodeMappings ( original, str, mappings, hires, sourcemapLocations, sourceIndex, offsets ) {
		// store locations, for fast lookup
		let lineStart = 0;
		const locations = original.split( '\n' ).map( line => {
			var start = lineStart;
			lineStart += line.length + 1; // +1 for the newline

			return start;
		});

		const inverseMappings = invert( str, mappings );

		let charOffset = 0;
		const lines = str.split( '\n' ).map( line => {
			let segments = [];

			let char; // TODO put these inside loop, once we've determined it's safe to do so transpilation-wise
			let origin;
			let lastOrigin;
			let location;

			let i;

			const len = line.length;
			for ( i = 0; i < len; i += 1 ) {
				char = i + charOffset;
				origin = inverseMappings[ char ];

				if ( !~origin ) {
					if ( !~lastOrigin ) {
						// do nothing
					} else {
						segments.push({
							generatedCodeColumn: i,
							sourceIndex: sourceIndex,
							sourceCodeLine: 0,
							sourceCodeColumn: 0
						});
					}
				}

				else {
					if ( !hires && ( origin === lastOrigin + 1 ) && !sourcemapLocations[ origin ] ) {
						// do nothing
					} else {
						location = MagicString_encodeMappings__getLocation( locations, origin );

						segments.push({
							generatedCodeColumn: i,
							sourceIndex: sourceIndex,
							sourceCodeLine: location.line,
							sourceCodeColumn: location.column
						});
					}
				}

				lastOrigin = origin;
			}

			charOffset += line.length + 1;
			return segments;
		});

		offsets = offsets || {};

		offsets.sourceIndex = offsets.sourceIndex || 0;
		offsets.sourceCodeLine = offsets.sourceCodeLine || 0;
		offsets.sourceCodeColumn = offsets.sourceCodeColumn || 0;

		const encoded = lines.map( segments => {
			var generatedCodeColumn = 0;

			return segments.map( segment => {
				const arr = [
					segment.generatedCodeColumn - generatedCodeColumn,
					segment.sourceIndex - offsets.sourceIndex,
					segment.sourceCodeLine - offsets.sourceCodeLine,
					segment.sourceCodeColumn - offsets.sourceCodeColumn
				];

				generatedCodeColumn = segment.generatedCodeColumn;
				offsets.sourceIndex = segment.sourceIndex;
				offsets.sourceCodeLine = segment.sourceCodeLine;
				offsets.sourceCodeColumn = segment.sourceCodeColumn;

				return encode( arr );
			}).join( ',' );
		}).join( ';' );

		return encoded;
	}


	function invert ( str, mappings ) {
		var inverted = new Uint32Array( str.length ), i;

		// initialise everything to -1
		i = str.length;
		while ( i-- ) {
			inverted[i] = -1;
		}

		// then apply the actual mappings
		i = mappings.length;
		while ( i-- ) {
			if ( ~mappings[i] ) {
				inverted[ mappings[i] ] = i;
			}
		}

		return inverted;
	}

	function MagicString_encodeMappings__getLocation ( locations, char ) {
		var i;

		i = locations.length;
		while ( i-- ) {
			if ( locations[i] <= char ) {
				return {
					line: i,
					column: char - locations[i]
				};
			}
		}

		throw new Error( 'Character out of bounds' );
	}

	function utils_getRelativePath__getRelativePath ( from, to ) {
		let fromParts = from.split( /[\/\\]/ );
		let toParts = to.split( /[\/\\]/ );

		fromParts.pop(); // get dirname

		while ( fromParts[0] === toParts[0] ) {
			fromParts.shift();
			toParts.shift();
		}

		if ( fromParts.length ) {
			let i = fromParts.length;
			while ( i-- ) fromParts[i] = '..';
		}

		return fromParts.concat( toParts ).join( '/' );
	}

	let MagicString__warned = false;

	class MagicString {
		constructor ( string, options = {} ) {
			this.original = this.str = string;
			this.mappings = initMappings( string.length );

			this.filename = options.filename;
			this.indentExclusionRanges = options.indentExclusionRanges;

			this.sourcemapLocations = {};

			this.indentStr = guessIndent( string );
		}

		addSourcemapLocation ( char ) {
			this.sourcemapLocations[ char ] = true;
		}

		append ( content ) {
			if ( typeof content !== 'string' ) {
				throw new TypeError( 'appended content must be a string' );
			}

			this.str += content;
			return this;
		}

		clone () {
			var clone, i;

			clone = new MagicString( this.original, { filename: this.filename });
			clone.str = this.str;

			i = clone.mappings.length;
			while ( i-- ) {
				clone.mappings[i] = this.mappings[i];
			}

			if ( this.indentExclusionRanges ) {
				clone.indentExclusionRanges = typeof this.indentExclusionRanges[0] === 'number' ?
					[ this.indentExclusionRanges[0], this.indentExclusionRanges[1] ] :
					this.indentExclusionRanges.map( ([ start, end ]) => [ start, end ] );
			}

			Object.keys( this.sourcemapLocations ).forEach( loc => {
				clone.sourcemapLocations[ loc ] = true;
			});

			return clone;
		}

		generateMap ( options ) {
			options = options || {};

			return new SourceMap({
				file: ( options.file ? options.file.split( /[\/\\]/ ).pop() : null ),
				sources: [ options.source ? utils_getRelativePath__getRelativePath( options.file || '', options.source ) : null ],
				sourcesContent: options.includeContent ? [ this.original ] : [ null ],
				names: [],
				mappings: this.getMappings( options.hires, 0 )
			});
		}

		getIndentString () {
			return this.indentStr === null ? '\t' : this.indentStr;
		}

		getMappings ( hires, sourceIndex, offsets ) {
			return encodeMappings( this.original, this.str, this.mappings, hires, this.sourcemapLocations, sourceIndex, offsets );
		}

		indent ( indentStr, options ) {
			var self = this,
				mappings = this.mappings,
				reverseMappings = reverse( mappings, this.str.length ),
				pattern = /^[^\r\n]/gm,
				match,
				inserts = [],
				adjustments,
				exclusions,
				lastEnd,
				i;

			if ( typeof indentStr === 'object' ) {
				options = indentStr;
				indentStr = undefined;
			}

			indentStr = indentStr !== undefined ? indentStr : ( this.indentStr || '\t' );

			if ( indentStr === '' ) return this; // noop

			options = options || {};

			// Process exclusion ranges
			if ( options.exclude ) {
				exclusions = typeof options.exclude[0] === 'number' ? [ options.exclude ] : options.exclude;

				exclusions = exclusions.map( function ( range ) {
					var rangeStart, rangeEnd;

					rangeStart = self.locate( range[0] );
					rangeEnd = self.locate( range[1] );

					if ( rangeStart === null || rangeEnd === null ) {
						throw new Error( 'Cannot use indices of replaced characters as exclusion ranges' );
					}

					return [ rangeStart, rangeEnd ];
				});

				exclusions.sort( function ( a, b ) {
					return a[0] - b[0];
				});

				// check for overlaps
				lastEnd = -1;
				exclusions.forEach( function ( range ) {
					if ( range[0] < lastEnd ) {
						throw new Error( 'Exclusion ranges cannot overlap' );
					}

					lastEnd = range[1];
				});
			}

			const indentStart = options.indentStart !== false;

			if ( !exclusions ) {
				this.str = this.str.replace( pattern, ( match, index ) => {
					if ( !indentStart && index === 0 ) {
						return match;
					}

					inserts.push( index );
					return indentStr + match;
				});
			} else {
				this.str = this.str.replace( pattern, ( match, index ) => {
					if ( ( !indentStart && index === 0 ) || isExcluded( index - 1 ) ) {
						return match;
					}

					inserts.push( index );
					return indentStr + match;
				});
			}

			adjustments = inserts.map( function ( index ) {
				var origin;

				do {
					origin = reverseMappings[ index++ ];
				} while ( !~origin && index < self.str.length );

				return origin;
			});

			i = adjustments.length;
			lastEnd = this.mappings.length;
			while ( i-- ) {
				adjust( self.mappings, adjustments[i], lastEnd, ( ( i + 1 ) * indentStr.length ) );
				lastEnd = adjustments[i];
			}

			return this;

			function isExcluded ( index ) {
				var i = exclusions.length, range;

				while ( i-- ) {
					range = exclusions[i];

					if ( range[1] < index ) {
						return false;
					}

					if ( range[0] <= index ) {
						return true;
					}
				}
			}
		}

		insert ( index, content ) {
			if ( typeof content !== 'string' ) {
				throw new TypeError( 'inserted content must be a string' );
			}

			if ( index === this.original.length ) {
				this.append( content );
			} else {
				var mapped = this.locate(index);

				if ( mapped === null ) {
					throw new Error( 'Cannot insert at replaced character index: ' + index );
				}

				this.str = this.str.substr( 0, mapped ) + content + this.str.substr( mapped );
				adjust( this.mappings, index, this.mappings.length, content.length );
			}

			return this;
		}

		// get current location of character in original string
		locate ( character ) {
			var loc;

			if ( character < 0 || character > this.mappings.length ) {
				throw new Error( 'Character is out of bounds' );
			}

			loc = this.mappings[ character ];
			return ~loc ? loc : null;
		}

		locateOrigin ( character ) {
			var i;

			if ( character < 0 || character >= this.str.length ) {
				throw new Error( 'Character is out of bounds' );
			}

			i = this.mappings.length;
			while ( i-- ) {
				if ( this.mappings[i] === character ) {
					return i;
				}
			}

			return null;
		}

		overwrite ( start, end, content ) {
			if ( typeof content !== 'string' ) {
				throw new TypeError( 'replacement content must be a string' );
			}

			var firstChar, lastChar, d;

			firstChar = this.locate( start );
			lastChar = this.locate( end - 1 );

			if ( firstChar === null || lastChar === null ) {
				throw new Error( `Cannot overwrite the same content twice: '${this.original.slice(start, end).replace(/\n/g, '\\n')}'` );
			}

			if ( firstChar > lastChar + 1 ) {
				throw new Error(
					'BUG! First character mapped to a position after the last character: ' +
					'[' + start + ', ' + end + '] -> [' + firstChar + ', ' + ( lastChar + 1 ) + ']'
				);
			}

			this.str = this.str.substr( 0, firstChar ) + content + this.str.substring( lastChar + 1 );

			d = content.length - ( lastChar + 1 - firstChar );

			MagicString__blank( this.mappings, start, end );
			adjust( this.mappings, end, this.mappings.length, d );
			return this;
		}

		prepend ( content ) {
			this.str = content + this.str;
			adjust( this.mappings, 0, this.mappings.length, content.length );
			return this;
		}

		remove ( start, end ) {
			var loc, d, i, currentStart, currentEnd;

			if ( start < 0 || end > this.mappings.length ) {
				throw new Error( 'Character is out of bounds' );
			}

			d = 0;
			currentStart = -1;
			currentEnd = -1;
			for ( i = start; i < end; i += 1 ) {
				loc = this.mappings[i];

				if ( ~loc ) {
					if ( !~currentStart ) {
						currentStart = loc;
					}

					currentEnd = loc + 1;

					this.mappings[i] = -1;
					d += 1;
				}
			}

			this.str = this.str.slice( 0, currentStart ) + this.str.slice( currentEnd );

			adjust( this.mappings, end, this.mappings.length, -d );
			return this;
		}

		replace ( start, end, content ) {
			if ( !MagicString__warned ) {
				console.warn( 'magicString.replace(...) is deprecated. Use magicString.overwrite(...) instead' );
				MagicString__warned = true;
			}

			return this.overwrite( start, end, content );
		}

		slice ( start, end = this.original.length ) {
			var firstChar, lastChar;

			while ( start < 0 ) start += this.original.length;
			while ( end < 0 ) end += this.original.length;

			firstChar = this.locate( start );
			lastChar = this.locate( end - 1 ) + 1;

			if ( firstChar === null || lastChar === null ) {
				throw new Error( 'Cannot use replaced characters as slice anchors' );
			}

			return this.str.slice( firstChar, lastChar );
		}

		snip ( start, end ) {
			const clone = this.clone();
			clone.remove( 0, start );
			clone.remove( end, clone.original.length );

			return clone;
		}

		toString () {
			return this.str;
		}

		trimLines() {
			return this.trim('[\\r\\n]');
		}

		trim (charType) {
			return this.trimStart(charType).trimEnd(charType);
		}

		trimEnd (charType) {
			var self = this;
			var rx = new RegExp((charType || '\\s') + '+$');

			this.str = this.str.replace( rx, function ( trailing, index, str ) {
				var strLength = str.length,
					length = trailing.length,
					i,
					chars = [];

				i = strLength;
				while ( i-- > strLength - length ) {
					chars.push( self.locateOrigin( i ) );
				}

				i = chars.length;
				while ( i-- ) {
					if ( chars[i] !== null ) {
						self.mappings[ chars[i] ] = -1;
					}
				}

				return '';
			});

			return this;
		}

		trimStart (charType) {
			var self = this;
			var rx = new RegExp('^' + (charType || '\\s') + '+');

			this.str = this.str.replace( rx, function ( leading ) {
				var length = leading.length, i, chars = [], adjustmentStart = 0;

				i = length;
				while ( i-- ) {
					chars.push( self.locateOrigin( i ) );
				}

				i = chars.length;
				while ( i-- ) {
					if ( chars[i] !== null ) {
						self.mappings[ chars[i] ] = -1;
						adjustmentStart += 1;
					}
				}

				adjust( self.mappings, adjustmentStart, self.mappings.length, -length );

				return '';
			});

			return this;
		}
	}

	function adjust ( mappings, start, end, d ) {
		var i = end;

		if ( !d ) return; // replacement is same length as replaced string

		while ( i-- > start ) {
			if ( ~mappings[i] ) {
				mappings[i] += d;
			}
		}
	}

	function initMappings ( i ) {
		var mappings = new Uint32Array( i );

		while ( i-- ) {
			mappings[i] = i;
		}

		return mappings;
	}

	function MagicString__blank ( mappings, start, i ) {
		while ( i-- > start ) {
			mappings[i] = -1;
		}
	}

	function reverse ( mappings, i ) {
		var result, location;

		result = new Uint32Array( i );

		while ( i-- ) {
			result[i] = -1;
		}

		i = mappings.length;
		while ( i-- ) {
			location = mappings[i];

			if ( ~location ) {
				result[ location ] = i;
			}
		}

		return result;
	}

	function sequence ( arr, callback ) {
		const len = arr.length;
		let results = new Array( len );

		let promise = sander__Promise.resolve();

		function next ( i ) {
			return promise
				.then( () => callback( arr[i], i ) )
				.then( result => results[i] = result );
		}

		let i;

		for ( i = 0; i < len; i += 1 ) {
			promise = next( i );
		}

		return promise.then( () => results );
	}


	function first ( arr, fail, callback ) {
		const len = arr.length;

		let promise = sander__Promise.reject( fail );

		function next ( i ) {
			return promise
				.catch(() => callback( arr[i], i ));
		}

		let i;

		for ( i = 0; i < len; i += 1 ) {
			promise = next( i );
		}

		return promise;
	}

	function utils_getLocation__getLocation ( source, charIndex ) {
		const lines = source.split( '\n' );
		const len = lines.length;

		let lineStart = 0;
		let i;

		for ( i = 0; i < len; i += 1 ) {
			const line = lines[i];
			const lineEnd =  lineStart + line.length + 1; // +1 for newline

			if ( lineEnd > charIndex ) {
				return { line: i + 1, column: charIndex - lineStart };
			}

			lineStart = lineEnd;
		}

		throw new Error( 'Could not determine location of character' );
	}

	let ast_walk__shouldSkip;
	let ast_walk__shouldAbort;

	function ast_walk__walk ( ast, { enter, leave }) {
		ast_walk__shouldAbort = false;
		ast_walk__visit( ast, null, enter, leave );
	}

	let ast_walk__context = {
		skip: () => ast_walk__shouldSkip = true,
		abort: () => ast_walk__shouldAbort = true
	};

	let ast_walk__childKeys = object__blank();

	let ast_walk__toString = Object.prototype.toString;

	function ast_walk__isArray ( thing ) {
		return ast_walk__toString.call( thing ) === '[object Array]';
	}

	function ast_walk__visit ( node, parent, enter, leave ) {
		if ( !node || ast_walk__shouldAbort ) return;

		if ( enter ) {
			ast_walk__shouldSkip = false;
			enter.call( ast_walk__context, node, parent );
			if ( ast_walk__shouldSkip || ast_walk__shouldAbort ) return;
		}

		let keys = ast_walk__childKeys[ node.type ] || (
			ast_walk__childKeys[ node.type ] = Object.keys( node ).filter( key => typeof node[ key ] === 'object' )
		);

		let key, value, i, j;

		i = keys.length;
		while ( i-- ) {
			key = keys[i];
			value = node[ key ];

			if ( ast_walk__isArray( value ) ) {
				j = value.length;
				while ( j-- ) {
					ast_walk__visit( value[j], node, enter, leave );
				}
			}

			else if ( value && value.type ) {
				ast_walk__visit( value, node, enter, leave );
			}
		}

		if ( leave && !ast_walk__shouldAbort ) {
			leave( node, parent );
		}
	}

	const blockDeclarations = {
		'const': true,
		'let': true
	};

	class ast_Scope__Scope {
		constructor ( options ) {
			options = options || {};

			this.parent = options.parent;
			this.depth = this.parent ? this.parent.depth + 1 : 0;
			this.declarations = object__blank();
			this.isBlockScope = !!options.block;

			if ( options.params ) {
				options.params.forEach( param => {
					this.declarations[ param.name ] = param;
				});
			}
		}

		// add ( name, isBlockDeclaration ) {
		// 	if ( !isBlockDeclaration && this.isBlockScope ) {
		// 		// it's a `var` or function declaration, and this
		// 		// is a block scope, so we need to go up
		// 		this.parent.add( name, isBlockDeclaration );
		// 	} else {
		// 		this.names.push( name );
		// 	}
		// }

		addDeclaration ( name, declaration ) {
			const isBlockDeclaration = declaration.type === 'VariableDeclaration' && blockDeclarations[ declaration.kind ];

			if ( !isBlockDeclaration && this.isBlockScope ) {
				// it's a `var` or function declaration, and this
				// is a block scope, so we need to go up
				this.parent.addDeclaration( name, declaration );
			} else {
				this.declarations[ name ] = declaration;
			}
		}

		contains ( name ) {
			return !!this.getDeclaration( name );
		}

		findDefiningScope ( name ) {
			if ( this.declarations[ name ] ) {
				return this;
			}

			if ( this.parent ) {
				return this.parent.findDefiningScope( name );
			}

			return null;
		}

		getDeclaration ( name ) {
			return this.declarations[ name ] ||
			       this.parent && this.parent.getDeclaration( name );
		}
	}

	function isIife ( node, parent ) {
		return parent && parent.type === 'CallExpression' && node === parent.callee;
	}

	class Statement {
		constructor ( node, module, start, end ) {
			this.node = node;
			this.module = module;
			this.start = start;
			this.end = end;
			this.next = null; // filled in later

			this.scope = new ast_Scope__Scope();
			this.defines = object__blank();
			this.modifies = object__blank();
			this.dependsOn = object__blank();
			this.stronglyDependsOn = object__blank();

			this.isIncluded = false;

			this.isImportDeclaration = node.type === 'ImportDeclaration';
			this.isExportDeclaration = /^Export/.test( node.type );
		}

		analyse () {
			if ( this.isImportDeclaration ) return; // nothing to analyse

			let scope = this.scope;

			ast_walk__walk( this.node, {
				enter ( node, parent ) {
					let newScope;

					switch ( node.type ) {
						case 'FunctionExpression':
						case 'FunctionDeclaration':
						case 'ArrowFunctionExpression':
							if ( node.type === 'FunctionDeclaration' ) {
								scope.addDeclaration( node.id.name, node );
							}

							newScope = new ast_Scope__Scope({
								parent: scope,
								params: node.params, // TODO rest params?
								block: false
							});

							// named function expressions - the name is considered
							// part of the function's scope
							if ( node.type === 'FunctionExpression' && node.id ) {
								newScope.addDeclaration( node.id.name, node );
							}

							break;

						case 'BlockStatement':
							if ( !/Function/.test( parent.type ) ) {
								newScope = new ast_Scope__Scope({
									parent: scope,
									block: true
								});
							}

							break;

						case 'CatchClause':
							newScope = new ast_Scope__Scope({
								parent: scope,
								params: [ node.param ],
								block: true
							});

							break;

						case 'VariableDeclaration':
							node.declarations.forEach( declarator => {
								scope.addDeclaration( declarator.id.name, node );
							});
							break;

						case 'ClassDeclaration':
							scope.addDeclaration( node.id.name, node );
							break;
					}

					if ( newScope ) {
						Object.defineProperty( node, '_scope', {
							value: newScope,
							configurable: true
						});

						scope = newScope;
					}
				},
				leave ( node ) {
					if ( node._scope ) {
						scope = scope.parent;
					}
				}
			});

			// This allows us to track whether we're looking at code that will
			// be executed immediately (either outside a function, or immediately
			// inside an IIFE), for the purposes of determining whether dependencies
			// are strong or weak. It's not bulletproof, since it wouldn't catch...
			//
			//    var calledImmediately = function () {
			//      doSomethingWith( strongDependency );
			//    }
			//    calledImmediately();
			//
			// ...but it's better than nothing
			let depth = 0;

			if ( !this.isImportDeclaration ) {
				ast_walk__walk( this.node, {
					enter: ( node, parent ) => {
						if ( node._scope ) {
							if ( !scope.isBlockScope && !isIife( node, parent ) ) depth += 1;
							scope = node._scope;
						}

						this.checkForReads( scope, node, parent, !depth );
						this.checkForWrites( scope, node );
					},
					leave: ( node, parent ) => {
						if ( node._scope ) {
							if ( !scope.isBlockScope && !isIife( node, parent ) ) depth -= 1;
							scope = scope.parent;
						}
					}
				});
			}

			object__keys( scope.declarations ).forEach( name => {
				this.defines[ name ] = true;
			});
		}

		checkForReads ( scope, node, parent, strong ) {
			if ( node.type === 'Identifier' ) {
				// disregard the `bar` in `foo.bar` - these appear as Identifier nodes
				if ( parent.type === 'MemberExpression' && !parent.computed && node !== parent.object ) {
					return;
				}

				// disregard the `bar` in { bar: foo }
				if ( parent.type === 'Property' && node !== parent.value ) {
					return;
				}

				// disregard the `bar` in `class Foo { bar () {...} }`
				if ( parent.type === 'MethodDefinition' ) return;

				// disregard the `bar` in `export { foo as bar }`
				if ( parent.type === 'ExportSpecifier' && node !== parent.local ) return;

				const definingScope = scope.findDefiningScope( node.name );

				if ( ( !definingScope || definingScope.depth === 0 ) && !this.defines[ node.name ] ) {
					this.dependsOn[ node.name ] = true;
					if ( strong ) this.stronglyDependsOn[ node.name ] = true;
				}
			}
		}

		checkForWrites ( scope, node ) {
			const addNode = ( node, isAssignment ) => {
				let depth = 0; // determine whether we're illegally modifying a binding or namespace

				while ( node.type === 'MemberExpression' ) {
					node = node.object;
					depth += 1;
				}

				// disallow assignments/updates to imported bindings and namespaces
				if ( isAssignment ) {
					const importSpecifier = this.module.imports[ node.name ];

					if ( importSpecifier && !scope.contains( node.name ) ) {
						const minDepth = importSpecifier.name === '*' ?
							2 : // cannot do e.g. `namespace.foo = bar`
							1;  // cannot do e.g. `foo = bar`, but `foo.bar = bar` is fine

						if ( depth < minDepth ) {
							const err = new Error( `Illegal reassignment to import '${node.name}'` );
							err.file = this.module.id;
							err.loc = utils_getLocation__getLocation( this.module.magicString.toString(), node.start );
							throw err;
						}
					}

					// special case = `export default foo; foo += 1;` - we'll
					// need to assign a new variable so that the exported
					// value is not updated by the second statement
					if ( this.module.exports.default && depth === 0 && this.module.exports.default.identifier === node.name ) {
						// but only if this is a) inside a function body or
						// b) after the export declaration
						if ( !!scope.parent || node.start > this.module.exports.default.statement.node.start ) {
							this.module.exports.default.isModified = true;
						}
					}
				}

				if ( node.type === 'Identifier' ) {
					this.modifies[ node.name ] = true;
				}
			};

			if ( node.type === 'AssignmentExpression' ) {
				addNode( node.left, true );
			}

			else if ( node.type === 'UpdateExpression' ) {
				addNode( node.argument, true );
			}

			else if ( node.type === 'CallExpression' ) {
				node.arguments.forEach( arg => addNode( arg, false ) );

				// `foo.bar()` is assumed to mutate foo
				if ( node.callee.type === 'MemberExpression' ) {
					addNode( node.callee );
				}
			}
		}

		mark () {
			if ( this.isIncluded ) return; // prevent infinite loops
			this.isIncluded = true;

			const dependencies = Object.keys( this.dependsOn );

			return sequence( dependencies, name => {
				if ( this.defines[ name ] ) return; // TODO maybe exclude from `this.dependsOn` in the first place?
				return this.module.mark( name );
			});
		}

		replaceIdentifiers ( magicString, names, bundleExports ) {
			const replacementStack = [ names ];
			const nameList = object__keys( names );

			let deshadowList = [];
			nameList.forEach( name => {
				const replacement = names[ name ];
				deshadowList.push( replacement.split( '.' )[0] );
			});

			let topLevel = true;
			let depth = 0;

			ast_walk__walk( this.node, {
				enter ( node, parent ) {
					if ( node._skip ) return this.skip();

					if ( /^Function/.test( node.type ) ) depth += 1;

					// `this` is undefined at the top level of ES6 modules
					if ( node.type === 'ThisExpression' && depth === 0 ) {
						magicString.overwrite( node.start, node.end, 'undefined' );
					}

					// special case - variable declarations that need to be rewritten
					// as bundle exports
					if ( topLevel ) {
						if ( node.type === 'VariableDeclaration' ) {
							// if this contains a single declarator, and it's one that
							// needs to be rewritten, we replace the whole lot
							const name = node.declarations[0].id.name;
							if ( node.declarations.length === 1 && bundleExports[ name ] ) {
								magicString.overwrite( node.start, node.declarations[0].id.end, bundleExports[ name ] );
								node.declarations[0].id._skip = true;
							}

							// otherwise, we insert the `exports.foo = foo` after the declaration
							else {
								const exportInitialisers = node.declarations
									.map( declarator => declarator.id.name )
									.filter( name => !!bundleExports[ name ] )
									.map( name => `\n${bundleExports[name]} = ${name};` )
									.join( '' );

								if ( exportInitialisers ) {
									// TODO clean this up
									try {
										magicString.insert( node.end, exportInitialisers );
									} catch ( err ) {
										magicString.append( exportInitialisers );
									}
								}
							}
						}
					}

					const scope = node._scope;

					if ( scope ) {
						topLevel = false;

						let newNames = object__blank();
						let hasReplacements;

						// special case = function foo ( foo ) {...}
						if ( node.id && names[ node.id.name ] && scope.declarations[ node.id.name ] ) {
							magicString.overwrite( node.id.start, node.id.end, names[ node.id.name ] );
						}

						object__keys( names ).forEach( name => {
							if ( !scope.declarations[ name ] ) {
								newNames[ name ] = names[ name ];
								hasReplacements = true;
							}
						});

						deshadowList.forEach( name => {
							if ( scope.declarations[ name ] ) {
								newNames[ name ] = name + '$$'; // TODO better mechanism
								hasReplacements = true;
							}
						});

						if ( !hasReplacements && depth > 0 ) {
							return this.skip();
						}

						names = newNames;
						replacementStack.push( newNames );
					}

					if ( node.type !== 'Identifier' ) return;

					// if there's no replacement, or it's the same, there's nothing more to do
					const name = names[ node.name ];
					if ( !name || name === node.name ) return;

					// shorthand properties (`obj = { foo }`) need to be expanded
					if ( parent.type === 'Property' && parent.shorthand ) {
						magicString.insert( node.end, `: ${name}` );
						parent.key._skip = true;
						parent.value._skip = true; // redundant, but defensive
						return;
					}

					// property names etc can be disregarded
					if ( parent.type === 'MemberExpression' && !parent.computed && node !== parent.object ) return;
					if ( parent.type === 'Property' && node !== parent.value ) return;
					if ( parent.type === 'MethodDefinition' && node === parent.key ) return;
					// TODO others...?

					// all other identifiers should be overwritten
					magicString.overwrite( node.start, node.end, name );
				},

				leave ( node ) {
					if ( /^Function/.test( node.type ) ) depth -= 1;

					if ( node._scope ) {
						replacementStack.pop();
						names = replacementStack[ replacementStack.length - 1 ];
					}
				}
			});

			return magicString;
		}

		toString () {
			return this.module.magicString.slice( this.start, this.end );
		}
	}

	const reservedWords = 'break case class catch const continue debugger default delete do else export extends finally for function if import in instanceof let new return super switch this throw try typeof var void while with yield enum await implements package protected static interface private public'.split( ' ' );
	const builtins = 'Infinity NaN undefined null true false eval uneval isFinite isNaN parseFloat parseInt decodeURI decodeURIComponent encodeURI encodeURIComponent escape unescape Object Function Boolean Symbol Error EvalError InternalError RangeError ReferenceError SyntaxError TypeError URIError Number Math Date String RegExp Array Int8Array Uint8Array Uint8ClampedArray Int16Array Uint16Array Int32Array Uint32Array Float32Array Float64Array Map Set WeakMap WeakSet SIMD ArrayBuffer DataView JSON Promise Generator GeneratorFunction Reflect Proxy Intl'.split( ' ' );

	let utils_makeLegalIdentifier__blacklisted = object__blank();
	reservedWords.concat( builtins ).forEach( word => utils_makeLegalIdentifier__blacklisted[ word ] = true );


	function makeLegalIdentifier ( str ) {
		str = str.replace( /[^$_a-zA-Z0-9]/g, '_' );
		if ( /\d/.test( str[0] ) || utils_makeLegalIdentifier__blacklisted[ str ] ) str = `_${str}`;

		return str;
	}

	const emptyPromise = sander__Promise.resolve();

	function src_Module__deconflict ( name, names ) {
		while ( name in names ) {
			name = `_${name}`;
		}

		return name;
	}

	function isEmptyExportedVarDeclaration ( node, module, allBundleExports, moduleReplacements, es6 ) {
		if ( node.type !== 'VariableDeclaration' || node.declarations[0].init ) return false;

		const name = node.declarations[0].id.name;
		const canonicalName = moduleReplacements[ name ] || name;

		return canonicalName in allBundleExports;
	}

	class Module {
		constructor ({ id, source, ast, bundle }) {
			this.source = source;

			this.bundle = bundle;
			this.id = id;

			// By default, `id` is the filename. Custom resolvers and loaders
			// can change that, but it makes sense to use it for the source filename
			this.magicString = new MagicString( source, {
				filename: id
			});

			// remove existing sourceMappingURL comments
			const pattern = /\/\/#\s+sourceMappingURL=.+\n?/g;
			let match;
			while ( match = pattern.exec( source ) ) {
				this.magicString.remove( match.index, match.index + match[0].length );
			}

			this.suggestedNames = object__blank();
			this.comments = [];

			this.statements = this.parse( ast );

			// imports and exports, indexed by ID
			this.imports = object__blank();
			this.exports = object__blank();

			this.exportAlls = object__blank();

			// array of all-export sources
			this.exportDelegates = [];

			this.replacements = object__blank();

			this.definitions = object__blank();
			this.definitionPromises = object__blank();
			this.modifications = object__blank();

			this.analyse();
		}

		addExport ( statement ) {
			const node = statement.node;
			const source = node.source && node.source.value;

			// export default function foo () {}
			// export default foo;
			// export default 42;
			if ( node.type === 'ExportDefaultDeclaration' ) {
				const isDeclaration = /Declaration$/.test( node.declaration.type );
				const isAnonymous = /(?:Class|Function)Expression$/.test( node.declaration.type );

				const identifier = isDeclaration ?
					node.declaration.id.name :
					node.declaration.type === 'Identifier' ?
						node.declaration.name :
						null;

				this.exports.default = {
					statement,
					name: 'default',
					localName: identifier || 'default',
					identifier,
					isDeclaration,
					isAnonymous,
					isModified: false // in case of `export default foo; foo = somethingElse`
				};
			}

			// export { foo, bar, baz }
			// export var foo = 42;
			// export function foo () {}
			else if ( node.type === 'ExportNamedDeclaration' ) {
				if ( node.specifiers.length ) {
					// export { foo, bar, baz }
					node.specifiers.forEach( specifier => {
						const localName = specifier.local.name;
						const exportedName = specifier.exported.name;

						// export { foo } from './foo';
						if ( source ) {
							this.imports[ localName ] = {
								source,
								localName: exportedName,
								name: localName
							};
						}

						this.exports[ exportedName ] = {
							statement,
							localName,
							exportedName,
							linkedImport: source ? this.imports[ localName ] : null
						};
					});
				}

				else {
					let declaration = node.declaration;

					let name;

					if ( declaration.type === 'VariableDeclaration' ) {
						// export var foo = 42
						name = declaration.declarations[0].id.name;
					} else {
						// export function foo () {}
						name = declaration.id.name;
					}

					this.exports[ name ] = {
						statement,
						localName: name,
						expression: declaration
					};
				}
			}

			// Store `export * from '...'` statements in an array of delegates.
			// When an unknown import is encountered, we see if one of them can satisfy it.
			else {
				this.exportDelegates.push({
					statement,
					source
				});
			}
		}

		addImport ( statement ) {
			const node = statement.node;
			const source = node.source.value;

			node.specifiers.forEach( specifier => {
				const isDefault = specifier.type === 'ImportDefaultSpecifier';
				const isNamespace = specifier.type === 'ImportNamespaceSpecifier';

				const localName = specifier.local.name;
				const name = isDefault ? 'default' : isNamespace ? '*' : specifier.imported.name;

				if ( this.imports[ localName ] ) {
					const err = new Error( `Duplicated import '${localName}'` );
					err.file = this.id;
					err.loc = utils_getLocation__getLocation( this.source, specifier.start );
					throw err;
				}

				this.imports[ localName ] = {
					source,
					name,
					localName
				};
			});
		}

		analyse () {
			// discover this module's imports and exports
			this.statements.forEach( statement => {
				if ( statement.isImportDeclaration ) this.addImport( statement );
				else if ( statement.isExportDeclaration ) this.addExport( statement );

				statement.analyse();

				// consolidate names that are defined/modified in this module
				object__keys( statement.defines ).forEach( name => {
					this.definitions[ name ] = statement;
				});

				object__keys( statement.modifies ).forEach( name => {
					( this.modifications[ name ] || ( this.modifications[ name ] = [] ) ).push( statement );
				});
			});

			// if names are referenced that are neither defined nor imported
			// in this module, we assume that they're globals
			this.statements.forEach( statement => {
				object__keys( statement.dependsOn ).forEach( name => {
					if ( !this.definitions[ name ] && !this.imports[ name ] ) {
						this.bundle.assumedGlobals[ name ] = true;
					}
				});
			});
		}

		consolidateDependencies () {
			let strongDependencies = object__blank();

			this.statements.forEach( statement => {
				if ( statement.isImportDeclaration && !statement.node.specifiers.length && !statement.module.isExternal ) {
					// include module for its side-effects
					strongDependencies[ statement.module.id ] = statement.module; // TODO is this right? `statement.module` should be `this`, surely?
				}

				object__keys( statement.stronglyDependsOn ).forEach( name => {
					if ( statement.defines[ name ] ) return;

					const exportAllDeclaration = this.exportAlls[ name ];

					if ( exportAllDeclaration && exportAllDeclaration.module && !exportAllDeclaration.module.isExternal ) {
						strongDependencies[ exportAllDeclaration.module.id ] = exportAllDeclaration.module;
						return;
					}

					const importDeclaration = this.imports[ name ];

					if ( importDeclaration && importDeclaration.module && !importDeclaration.module.isExternal ) {
						strongDependencies[ importDeclaration.module.id ] = importDeclaration.module;
					}
				});
			});

			let weakDependencies = object__blank();

			this.statements.forEach( statement => {
				object__keys( statement.dependsOn ).forEach( name => {
					if ( statement.defines[ name ] ) return;

					const importDeclaration = this.imports[ name ];

					if ( importDeclaration && importDeclaration.module && !importDeclaration.module.isExternal ) {
						weakDependencies[ importDeclaration.module.id ] = importDeclaration.module;
					}
				});
			});

			return { strongDependencies, weakDependencies };
		}

		defaultName () {
			const defaultExport = this.exports.default;

			if ( !defaultExport ) return null;

			const name = defaultExport.identifier && !defaultExport.isModified ?
				defaultExport.identifier :
				this.replacements.default;

			return this.replacements[ name ] || name;
		}

		findDefiningStatement ( name ) {
			if ( this.definitions[ name ] ) return this.definitions[ name ];

			// TODO what about `default`/`*`?

			const importDeclaration = this.imports[ name ];
			if ( !importDeclaration ) return null;

			return sander__Promise.resolve( importDeclaration.module || this.bundle.fetchModule( importDeclaration.source, this.id ) )
				.then( module => {
					importDeclaration.module = module;
					return module.findDefiningStatement( name );
				});
		}

		findDeclaration ( localName ) {
			const importDeclaration = this.imports[ localName ];

			// name was defined by another module
			if ( importDeclaration ) {
				const module = importDeclaration.module;

				if ( module.isExternal ) return null;
				if ( importDeclaration.name === '*' ) return null;
				if ( importDeclaration.name === 'default' ) return null;

				const exportDeclaration = module.exports[ importDeclaration.name ];
				return module.findDeclaration( exportDeclaration.localName );
			}

			// name was defined by this module, if any
			let i = this.statements.length;
			while ( i-- ) {
				const declaration = this.statements[i].scope.declarations[ localName ];
				if ( declaration ) {
					return declaration;
				}
			}

			return null;
		}

		mark ( name ) {
			// shortcut cycles
			if ( this.definitionPromises[ name ] ) {
				return emptyPromise;
			}

			let promise;

			// The definition for this name is in a different module
			if ( this.imports[ name ] ) {
				const importDeclaration = this.imports[ name ];
				importDeclaration.isUsed = true;

				promise = this.bundle.fetchModule( importDeclaration.source, this.id )
					.then( module => {
						importDeclaration.module = module;

						// suggest names. TODO should this apply to non default/* imports?
						if ( importDeclaration.name === 'default' ) {
							// TODO this seems ropey
							const localName = importDeclaration.localName;
							let suggestion = this.suggestedNames[ localName ] || localName;

							// special case - the module has its own import by this name
							while ( !module.isExternal && module.imports[ suggestion ] ) {
								suggestion = `_${suggestion}`;
							}

							module.suggestName( 'default', suggestion );
						} else if ( importDeclaration.name === '*' ) {
							const localName = importDeclaration.localName;
							const suggestion = this.suggestedNames[ localName ] || localName;
							module.suggestName( '*', suggestion );
							module.suggestName( 'default', `${suggestion}__default` );
						}

						if ( importDeclaration.name === 'default' && ( module.isExternal || !module.exports.default.linkedImport ) ) { // special case - exclude `export { default } from ...`
							module.needsDefault = true;
						} else if ( importDeclaration.name === '*' ) {
							module.needsAll = true;
						} else {
							module.needsNamed = true;
						}

						if ( module.isExternal ) {
							module.importedByBundle.push( importDeclaration );
							return emptyPromise;
						}

						if ( importDeclaration.name === '*' ) {
							// we need to create an internal namespace
							if ( !~this.bundle.internalNamespaceModules.indexOf( module ) ) {
								this.bundle.internalNamespaceModules.push( module );
							}

							return module.markAllExportStatements();
						}

						const exportDeclaration = module.exports[ importDeclaration.name ];

						if ( !exportDeclaration ) {
							const noExport = new Error( `Module ${module.id} does not export ${importDeclaration.name} (imported by ${this.id})` );

							// See if there exists an export delegate that defines `name`.
							return first( module.exportDelegates, noExport, declaration => {
								return module.bundle.fetchModule( declaration.source, module.id ).then( submodule => {
									declaration.module = submodule;

									return submodule.mark( name ).then( result => {
										if ( !result.length ) throw noExport;

										// It's found! This module exports `name` through declaration.
										// It is however not imported into this scope.
										module.exportAlls[ name ] = declaration;

										declaration.statement.dependsOn[ name ] =
										declaration.statement.stronglyDependsOn[ name ] = result;

										return result;
									});
								});
							});
						}

						exportDeclaration.isUsed = true;

						if ( importDeclaration.name === 'default' ) {
							return exportDeclaration.statement.mark();
						}

						return module.mark( exportDeclaration.localName );
					});
			}

			else {
				const statement = name === 'default' ? this.exports.default.statement : this.definitions[ name ];
				promise = statement && statement.mark();
			}

			this.definitionPromises[ name ] = promise || emptyPromise;
			return this.definitionPromises[ name ];
		}

		markAllStatements ( isEntryModule ) {
			return sequence( this.statements, statement => {
				if ( statement.isIncluded ) return; // TODO can this happen? probably not...

				// skip import declarations...
				if ( statement.isImportDeclaration ) {
					// ...unless they're empty, in which case assume we're importing them for the side-effects
					// THIS IS NOT FOOLPROOF. Probably need /*rollup: include */ or similar
					if ( !statement.node.specifiers.length ) {
						return this.bundle.fetchModule( statement.node.source.value, this.id )
							.then( module => {
								statement.module = module;
								if ( module.isExternal ) {
									return;
								}
								return module.markAllStatements();
							});
					}

					return;
				}

				// skip `export { foo, bar, baz }`...
				if ( statement.node.type === 'ExportNamedDeclaration' && statement.node.specifiers.length ) {
					// ...but ensure they are defined, if this is the entry module
					if ( isEntryModule ) {
						return statement.mark();
					}

					return;
				}

				// include everything else
				return statement.mark();
			});
		}

		markAllExportStatements () {
			return sequence( this.statements, statement => {
				return statement.isExportDeclaration ?
					statement.mark() :
					null;
			});
		}

		acorn.parse ( ast ) {
			// The ast can be supplied programmatically (but usually won't be)
			if ( !ast ) {
				// Try to extract a list of top-level statements/declarations. If
				// the parse fails, attach file info and abort
				try {
					ast = acorn.parse( this.source, {
						ecmaVersion: 6,
						sourceType: 'module',
						onComment: ( block, text, start, end ) => this.comments.push({ block, text, start, end })
					});
				} catch ( err ) {
					err.code = 'PARSE_ERROR';
					err.file = this.id; // see above - not necessarily true, but true enough
					throw err;
				}
			}

			ast_walk__walk( ast, {
				enter: node => {
					this.magicString.addSourcemapLocation( node.start );
					this.magicString.addSourcemapLocation( node.end );
				}
			});

			let statements = [];
			let lastChar = 0;
			let commentIndex = 0;

			ast.body.forEach( node => {
				// special case - top-level var declarations with multiple declarators
				// should be split up. Otherwise, we may end up including code we
				// don't need, just because an unwanted declarator is included
				if ( node.type === 'VariableDeclaration' && node.declarations.length > 1 ) {
					// remove the leading var/let/const
					this.magicString.remove( node.start, node.declarations[0].start );

					node.declarations.forEach( declarator => {
						const { start, end } = declarator;

						const syntheticNode = {
							type: 'VariableDeclaration',
							kind: node.kind,
							start,
							end,
							declarations: [ declarator ],
							isSynthetic: true
						};

						const statement = new Statement( syntheticNode, this, start, end );
						statements.push( statement );
					});

					lastChar = node.end; // TODO account for trailing line comment
				}

				else {
					let comment;
					do {
						comment = this.comments[ commentIndex ];
						if ( !comment ) break;
						if ( comment.start > node.start ) break;
						commentIndex += 1;
					} while ( comment.end < lastChar );

					const start = comment ? Math.min( comment.start, node.start ) : node.start;
					const end = node.end; // TODO account for trailing line comment

					const statement = new Statement( node, this, start, end );
					statements.push( statement );

					lastChar = end;
				}
			});

			statements.forEach( ( statement, i ) => {
				const nextStatement = statements[ i + 1 ];
				statement.next = nextStatement ? nextStatement.start : statement.end;
			});

			return statements;
		}

		rename ( name, replacement ) {
			this.replacements[ name ] = replacement;
		}

		render ( allBundleExports, moduleReplacements, format ) {
			let magicString = this.magicString.clone();

			this.statements.forEach( statement => {
				if ( !statement.isIncluded ) {
					magicString.remove( statement.start, statement.next );
					return;
				}

				// skip `export { foo, bar, baz }`
				if ( statement.node.type === 'ExportNamedDeclaration' ) {
					// skip `export { foo, bar, baz }`
					if ( statement.node.specifiers.length ) {
						magicString.remove( statement.start, statement.next );
						return;
					}

					// skip `export var foo;` if foo is exported
					if ( isEmptyExportedVarDeclaration( statement.node.declaration, this, allBundleExports, moduleReplacements, format === 'es6' ) ) {
						magicString.remove( statement.start, statement.next );
						return;
					}
				}

				// skip empty var declarations for exported bindings
				// (otherwise we're left with `exports.foo;`, which is useless)
				if ( isEmptyExportedVarDeclaration( statement.node, this, allBundleExports, moduleReplacements, format === 'es6' ) ) {
					magicString.remove( statement.start, statement.next );
					return;
				}

				// split up/remove var declarations as necessary
				if ( statement.node.isSynthetic ) {
					// insert `var/let/const` if necessary
					if ( !allBundleExports[ statement.node.declarations[0].id.name ] ) {
						magicString.insert( statement.start, `${statement.node.kind} ` );
					}

					magicString.overwrite( statement.end, statement.next, ';\n' ); // TODO account for trailing newlines
				}

				let replacements = object__blank();
				let bundleExports = object__blank();

				object__keys( statement.dependsOn )
					.concat( object__keys( statement.defines ) )
					.forEach( name => {
						const bundleName = moduleReplacements[ name ] || name;

						if ( allBundleExports[ bundleName ] ) {
							bundleExports[ name ] = replacements[ name ] = allBundleExports[ bundleName ];
						} else if ( bundleName !== name ) { // TODO weird structure
							replacements[ name ] = bundleName;
						}
					});

				statement.replaceIdentifiers( magicString, replacements, bundleExports );

				// modify exports as necessary
				if ( statement.isExportDeclaration ) {
					// remove `export` from `export var foo = 42`
					if ( statement.node.type === 'ExportNamedDeclaration' && statement.node.declaration.type === 'VariableDeclaration' ) {
						magicString.remove( statement.node.start, statement.node.declaration.start );
					}

					// remove `export` from `export class Foo {...}` or `export default Foo`
					// TODO default exports need different treatment
					else if ( statement.node.declaration.id ) {
						magicString.remove( statement.node.start, statement.node.declaration.start );
					}

					else if ( statement.node.type === 'ExportDefaultDeclaration' ) {
						const canonicalName = this.defaultName();

						if ( statement.node.declaration.type === 'Identifier' && canonicalName === ( moduleReplacements[ statement.node.declaration.name ] || statement.node.declaration.name ) ) {
							magicString.remove( statement.start, statement.next );
							return;
						}

						// prevent `var undefined = sideEffectyDefault(foo)`
						if ( canonicalName === undefined ) {
							magicString.remove( statement.start, statement.node.declaration.start );
							return;
						}

						// anonymous functions should be converted into declarations
						if ( statement.node.declaration.type === 'FunctionExpression' ) {
							magicString.overwrite( statement.node.start, statement.node.declaration.start + 8, `function ${canonicalName}` );
						} else {
							magicString.overwrite( statement.node.start, statement.node.declaration.start, `var ${canonicalName} = ` );
						}
					}

					else {
						throw new Error( 'Unhandled export' );
					}
				}
			});

			return magicString.trim();
		}

		suggestName ( defaultOrBatch, suggestion ) {
			// deconflict anonymous default exports with this module's definitions
			const shouldDeconflict = this.exports.default && this.exports.default.isAnonymous;

			if ( shouldDeconflict ) suggestion = src_Module__deconflict( suggestion, this.definitions );

			if ( !this.suggestedNames[ defaultOrBatch ] ) {
				this.suggestedNames[ defaultOrBatch ] = makeLegalIdentifier( suggestion );
			}
		}
	}

	class ExternalModule {
		constructor ( id ) {
			this.id = id;
			this.name = null;

			this.isExternal = true;
			this.importedByBundle = [];

			this.suggestedNames = object__blank();

			this.needsDefault = false;

			// Invariant: needsNamed and needsAll are never both true at once.
			// Because an import with both a namespace and named import is invalid:
			//
			// 		import * as ns, { a } from '...'
			//
			this.needsNamed = false;
			this.needsAll = false;
		}

		findDefiningStatement () {
			return null;
		}

		rename ( name, replacement ) {
			// noop
		}

		suggestName ( exportName, suggestion ) {
			if ( !this.suggestedNames[ exportName ] ) {
				this.suggestedNames[ exportName ] = suggestion;
			}
		}
	}

	function map_helpers__getName ( x ) {
		return x.name;
	}

	function quoteId ( x ) {
		return `'${x.id}'`;
	}

	function map_helpers__req ( x ) {
		return `require('${x.id}')`;
	}

	function getInteropBlock ( bundle ) {
		return bundle.externalModules
			.map( module => {
				return module.needsDefault ?
					( module.needsNamed ?
						`var ${module.name}__default = 'default' in ${module.name} ? ${module.name}['default'] : ${module.name};` :
						`${module.name} = 'default' in ${module.name} ? ${module.name}['default'] : ${module.name};` ) :
					null;
			})
			.filter( Boolean )
			.join( '\n' );
	}

	function getExportBlock ( bundle, exportMode, mechanism = 'return' ) {
		if ( exportMode === 'default' ) {
			const defaultExport = bundle.entryModule.exports.default;

			const defaultExportName = bundle.entryModule.replacements.default ||
				defaultExport.identifier;

			return `${mechanism} ${defaultExportName};`;
		}

		return bundle.toExport
			.map( name => {
				const prop = name === 'default' ? `['default']` : `.${name}`;
				name = bundle.trace( bundle.entryModule, name );
				return `exports${prop} = ${name};`;
			})
			.join( '\n' );
	}

	function finalisers_amd__amd ( bundle, magicString, { exportMode, indentString }, options ) {
		let deps = bundle.externalModules.map( quoteId );
		let args = bundle.externalModules.map( map_helpers__getName );

		if ( exportMode === 'named' ) {
			args.unshift( `exports` );
			deps.unshift( `'exports'` );
		}

		const params =
			( options.moduleId ? `'${options.moduleId}', ` : `` ) +
			( deps.length ? `[${deps.join( ', ' )}], ` : `` );

		const useStrict = options.useStrict !== false ? ` 'use strict';` : ``;
		const intro = `define(${params}function (${args.join( ', ' )}) {${useStrict}\n\n`;

		// var foo__default = 'default' in foo ? foo['default'] : foo;
		const interopBlock = getInteropBlock( bundle );
		if ( interopBlock ) magicString.prepend( interopBlock + '\n\n' );

		const exportBlock = getExportBlock( bundle, exportMode );
		if ( exportBlock ) magicString.append( '\n\n' + exportBlock );

		return magicString
			.indent( indentString )
			.append( '\n\n});' )
			.prepend( intro );
	}

	function finalisers_cjs__cjs ( bundle, magicString, { exportMode }, options ) {
		let intro = options.useStrict === false ? `` : `'use strict';\n\n`;

		// TODO handle empty imports, once they're supported
		const importBlock = bundle.externalModules
			.map( module => {
				let requireStatement = `var ${module.name} = require('${module.id}');`;

				if ( module.needsDefault ) {
					requireStatement += '\n' + ( module.needsNamed ? `var ${module.name}__default = ` : `${module.name} = ` ) +
						`'default' in ${module.name} ? ${module.name}['default'] : ${module.name};`;
				}

				return requireStatement;
			})
			.join( '\n' );

		if ( importBlock ) {
			intro += importBlock + '\n\n';
		}

		magicString.prepend( intro );

		const exportBlock = getExportBlock( bundle, exportMode, 'module.exports =' );
		if ( exportBlock ) magicString.append( '\n\n' + exportBlock );

		return magicString;
	}

	function uniqueNames ( declarations ) {
		let uniques = object__blank();

		declarations
			.filter( declaration => !/^(default|\*)$/.test( declaration.name ) )
			.forEach( declaration => uniques[ declaration.name ] = true );

		return object__keys( uniques );
	}

	function es6 ( bundle, magicString ) {
		const importBlock = bundle.externalModules
			.map( module => {
				const specifiers = [];

				if ( module.needsDefault ) {
					specifiers.push( module.importedByBundle.filter( declaration =>
						declaration.name === 'default' )[0].localName );
				}

				if ( module.needsAll ) {
					specifiers.push( '* as ' + module.importedByBundle.filter( declaration =>
						declaration.name === '*' )[0].localName );
				}

				if ( module.needsNamed ) {
					specifiers.push( '{ ' + uniqueNames( module.importedByBundle )
						.join( ', ' ) + ' }' );
				}

				return specifiers.length ?
					`import ${specifiers.join( ', ' )} from '${module.id}';` :
					`import '${module.id}';`;
			})
			.join( '\n' );

		if ( importBlock ) {
			magicString.prepend( importBlock + '\n\n' );
		}

		const exports = bundle.entryModule.exports;
		const exportBlock = object__keys( exports ).map( exportedName => {
			const specifier = exports[ exportedName ];

			const canonicalName = bundle.entryModule.replacements[ specifier.localName ] || specifier.localName;

			if ( exportedName === 'default' ) {
				return `export default ${canonicalName};`;
			}

			return exportedName === canonicalName ?
				`export { ${exportedName} };` :
				`export { ${canonicalName} as ${exportedName} };`;
		}).join( '\n' );

		if ( exportBlock ) {
			magicString.append( '\n\n' + exportBlock );
		}

		return magicString.trim();
	}

	function iife ( bundle, magicString, { exportMode, indentString }, options ) {
		const globalNames = options.globals || object__blank();

		let dependencies = bundle.externalModules.map( module => {
			return globalNames[ module.id ] || module.name;
		});

		let args = bundle.externalModules.map( map_helpers__getName );

		if ( exportMode !== 'none' && !options.moduleName ) {
			throw new Error( 'You must supply options.moduleName for IIFE bundles' );
		}

		if ( exportMode === 'named' ) {
			dependencies.unshift( `(this.${options.moduleName} = {})` );
			args.unshift( 'exports' );
		}

		const useStrict = options.useStrict !== false ? ` 'use strict';` : ``;
		let intro = `(function (${args}) {${useStrict}\n\n`;
		let outro = `\n\n})(${dependencies});`;

		if ( exportMode === 'default' ) {
			intro = `var ${options.moduleName} = ${intro}`;
		}

		// var foo__default = 'default' in foo ? foo['default'] : foo;
		const interopBlock = getInteropBlock( bundle );
		if ( interopBlock ) magicString.prepend( interopBlock + '\n\n' );

		const exportBlock = getExportBlock( bundle, exportMode );
		if ( exportBlock ) magicString.append( '\n\n' + exportBlock );

		return magicString
			.indent( indentString )
			.prepend( intro )
			.append( outro );
	}

	function finalisers_umd__umd ( bundle, magicString, { exportMode, indentString }, options ) {
		if ( exportMode !== 'none' && !options.moduleName ) {
			throw new Error( 'You must supply options.moduleName for UMD bundles' );
		}

		const globalNames = options.globals || object__blank();

		let amdDeps = bundle.externalModules.map( quoteId );
		let cjsDeps = bundle.externalModules.map( map_helpers__req );
		let globalDeps = bundle.externalModules.map( module => {
			return 'global.' + (globalNames[ module.id ] || module.name);
		});

		let args = bundle.externalModules.map( map_helpers__getName );

		if ( exportMode === 'named' ) {
			amdDeps.unshift( `'exports'` );
			cjsDeps.unshift( `exports` );
			globalDeps.unshift( `(global.${options.moduleName} = {})` );

			args.unshift( 'exports' );
		}

		const amdParams =
			( options.moduleId ? `'${options.moduleId}', ` : `` ) +
			( amdDeps.length ? `[${amdDeps.join( ', ' )}], ` : `` );

		const cjsExport = exportMode === 'default' ? `module.exports = ` : ``;
		const defaultExport = exportMode === 'default' ? `global.${options.moduleName} = ` : '';

		const useStrict = options.useStrict !== false ? ` 'use strict';` : ``;

		const intro =
			`(function (global, factory) {
			typeof exports === 'object' && typeof module !== 'undefined' ? ${cjsExport}factory(${cjsDeps.join( ', ' )}) :
			typeof define === 'function' && define.amd ? define(${amdParams}factory) :
			${defaultExport}factory(${globalDeps});
		}(this, function (${args}) {${useStrict}

		`.replace( /^\t\t/gm, '' ).replace( /^\t/gm, magicString.getIndentString() );

		// var foo__default = 'default' in foo ? foo['default'] : foo;
		const interopBlock = getInteropBlock( bundle );
		if ( interopBlock ) magicString.prepend( interopBlock + '\n\n' );

		const exportBlock = getExportBlock( bundle, exportMode );
		if ( exportBlock ) magicString.append( '\n\n' + exportBlock );

		return magicString
			.trim()
			.indent( indentString )
			.append( '\n\n}));' )
			.prepend( intro );
	}

	var finalisers = { amd, cjs, es6, iife, umd };

	function ensureArray ( thing ) {
		if ( Array.isArray( thing ) ) return thing;
		if ( thing == undefined ) return [];
		return [ thing ];
	}

	function defaultResolver ( importee, importer, options ) {
		// absolute paths are left untouched
		if ( isAbsolute( importee ) ) return importee;

		// if this is the entry point, resolve against cwd
		if ( importer === undefined ) return resolve( process.cwd(), importee );

		// we try to resolve external modules
		if ( importee[0] !== '.' ) {
			// unless we want to keep it external, that is
			if ( ~options.external.indexOf( importee ) ) return null;

			return options.resolveExternal( importee, importer, options );
		}

		return resolve( dirname( importer ), importee ).replace( /\.js$/, '' ) + '.js';
	}

	function defaultExternalResolver ( id, importer ) {
		// for now, only node_modules is supported, and only jsnext:main
		const root = absolutePath.exec( importer )[0];
		let dir = dirname( importer );

		while ( dir !== root ) {
			const pkgPath = resolve( dir, 'node_modules', id, 'package.json' );
			let pkgJson;

			try {
				pkgJson = readFileSync( pkgPath ).toString();
			} catch ( err ) {
				// noop
			}

			if ( pkgJson ) {
				let pkg;

				try {
					pkg = JSON.parse( pkgJson );
				} catch ( err ) {
					throw new Error( `Malformed JSON: ${pkgPath}` );
				}

				const main = pkg[ 'jsnext:main' ];

				if ( !main ) {
					throw new Error( `Package ${id} does not have a jsnext:main field, and so cannot be included in your rollup. Try adding it as an external module instead (e.g. options.external = ['${id}']). See https://github.com/rollup/rollup/wiki/jsnext:main for more info` );
				}

				return resolve( dirname( pkgPath ), main ).replace( /\.js$/, '' ) + '.js';
			}

			dir = dirname( dir );
		}

		throw new Error( `Could not find package ${id} (required by ${importer})` );
	}

	function defaultLoader ( id, options ) {
		// TODO support plugins e.g. !css and !json?
		const source = readFileSync( id, { encoding: 'utf-8' });

		return options.transform.reduce( ( source, transformer ) => {
			return transformer( source, id );
		}, source );
	}

	function badExports ( option, keys ) {
		throw new Error( `'${option}' was specified for options.exports, but entry module has following exports: ${keys.join(', ')}` );
	}

	function getExportMode ( bundle, exportMode ) {
		const exportKeys = object__keys( bundle.entryModule.exports );

		if ( exportMode === 'default' ) {
			if ( exportKeys.length !== 1 || exportKeys[0] !== 'default' ) {
				badExports( 'default', exportKeys );
			}
		} else if ( exportMode === 'none' && exportKeys.length ) {
			badExports( 'none', exportKeys );
		}

		if ( !exportMode || exportMode === 'auto' ) {
			if ( exportKeys.length === 0 ) {
				exportMode = 'none';
			} else if ( exportKeys.length === 1 && exportKeys[0] === 'default' ) {
				exportMode = 'default';
			} else {
				exportMode = 'named';
			}
		}

		if ( !/(?:default|named|none)/.test( exportMode ) ) {
			throw new Error( `options.exports must be 'default', 'named', 'none', 'auto', or left unspecified (defaults to 'auto')` );
		}

		return exportMode;
	}

	function utils_getIndentString__getIndentString ( magicString, options ) {
		if ( !( 'indent' in options ) || options.indent === true ) {
			return magicString.getIndentString();
		}

		return options.indent || '';
	}

	function unixizePath ( path ) {
		return path.split( /[\/\\]/ ).join( '/' );
	}

	class Bundle {
		constructor ( options ) {
			this.entry = options.entry;
			this.entryModule = null;

			this.resolveId = options.resolveId || defaultResolver;
			this.load = options.load || defaultLoader;

			this.resolveOptions = {
				external: ensureArray( options.external ),
				resolveExternal: options.resolveExternal || defaultExternalResolver
			};

			this.loadOptions = {
				transform: ensureArray( options.transform )
			};

			this.toExport = null;

			this.modulePromises = object__blank();
			this.modules = [];

			this.statements = null;
			this.externalModules = [];
			this.internalNamespaceModules = [];

			this.assumedGlobals = object__blank();
			this.assumedGlobals.exports = true; // TODO strictly speaking, this only applies with non-ES6, non-default-only bundles
		}

		build () {
			return this.fetchModule( this.entry, undefined )
				.then( entryModule => {
					const defaultExport = entryModule.exports.default;

					this.entryModule = entryModule;

					if ( defaultExport ) {
						entryModule.needsDefault = true;

						// `export default function foo () {...}` -
						// use the declared name for the export
						if ( defaultExport.identifier ) {
							entryModule.suggestName( 'default', defaultExport.identifier );
						}

						// `export default a + b` - generate an export name
						// based on the id of the entry module
						else {
							let defaultExportName = makeLegalIdentifier( basename( this.entryModule.id ).slice( 0, -extname( this.entryModule.id ).length ) );

							// deconflict
							let topLevelNames = [];
							entryModule.statements.forEach( statement => {
								object__keys( statement.defines ).forEach( name => topLevelNames.push( name ) );
							});

							while ( ~topLevelNames.indexOf( defaultExportName ) ) {
								defaultExportName = `_${defaultExportName}`;
							}

							entryModule.suggestName( 'default', defaultExportName );
						}
					}

					return entryModule.markAllStatements( true );
				})
				.then( () => {
					return this.markAllModifierStatements();
				})
				.then( () => {
					this.orderedModules = this.sort();
				});
		}

		// TODO would be better to deconflict once, rather than per-render
		deconflict ( es6 ) {
			let usedNames = object__blank();

			// ensure no conflicts with globals
			object__keys( this.assumedGlobals ).forEach( name => usedNames[ name ] = true );

			let allReplacements = object__blank();

			// Assign names to external modules
			this.externalModules.forEach( module => {
				// while we're here...
				allReplacements[ module.id ] = object__blank();

				// TODO is this necessary in the ES6 case?
				let name = makeLegalIdentifier( module.suggestedNames['*'] || module.suggestedNames.default || module.id );
				module.name = getSafeName( name );
			});

			// Discover conflicts (i.e. two statements in separate modules both define `foo`)
			let i = this.orderedModules.length;
			while ( i-- ) {
				const module = this.orderedModules[i];

				// while we're here...
				allReplacements[ module.id ] = object__blank();

				object__keys( module.definitions ).forEach( name => {
					const safeName = getSafeName( name );
					if ( safeName !== name ) {
						module.rename( name, safeName );
						allReplacements[ module.id ][ name ] = safeName;
					}
				});
			}

			// Assign non-conflicting names to internal default/namespace export
			this.orderedModules.forEach( module => {
				if ( !module.needsDefault && !module.needsAll ) return;

				if ( module.needsAll ) {
					const namespaceName = getSafeName( module.suggestedNames[ '*' ] );
					module.replacements[ '*' ] = namespaceName;
				}

				if ( module.needsDefault || module.needsAll && module.exports.default ) {
					const defaultExport = module.exports.default;

					// only create a new name if either
					//   a) it's an expression (`export default 42`) or
					//   b) it's a name that is reassigned to (`export var a = 1; a = 2`)
					if ( defaultExport && defaultExport.identifier && !defaultExport.isModified ) return; // TODO encapsulate check for whether we need synthetic default name

					const defaultName = getSafeName( module.suggestedNames.default );
					module.replacements.default = defaultName;
				}
			});

			this.orderedModules.forEach( module => {
				object__keys( module.imports ).forEach( localName => {
					if ( !module.imports[ localName ].isUsed ) return;

					const bundleName = this.trace( module, localName, es6 );
					if ( bundleName !== localName ) {
						allReplacements[ module.id ][ localName ] = bundleName;
					}
				});
			});

			function getSafeName ( name ) {
				while ( usedNames[ name ] ) {
					name = `_${name}`;
				}

				usedNames[ name ] = true;
				return name;
			}

			return allReplacements;
		}

		fetchModule ( importee, importer ) {
			return sander__Promise.resolve( this.resolveId( importee, importer, this.resolveOptions ) )
				.then( id => {
					if ( !id ) {
						// external module
						if ( !this.modulePromises[ importee ] ) {
							const module = new ExternalModule( importee );
							this.externalModules.push( module );
							this.modulePromises[ importee ] = sander__Promise.resolve( module );
						}

						return this.modulePromises[ importee ];
					}

					if ( id === importer ) {
						throw new Error( `A module cannot import itself (${id})` );
					}

					if ( !this.modulePromises[ id ] ) {
						this.modulePromises[ id ] = sander__Promise.resolve( this.load( id, this.loadOptions ) )
							.then( source => {
								let ast;

								if ( typeof source === 'object' ) {
									ast = source.ast;
									source = source.code;
								}

								const module = new Module({
									id,
									source,
									ast,
									bundle: this
								});

								this.modules.push( module );

								return module;
							});
					}

					return this.modulePromises[ id ];
				});
		}

		markAllModifierStatements () {
			let settled = true;
			let promises = [];

			this.modules.forEach( module => {
				module.statements.forEach( statement => {
					if ( statement.isIncluded ) return;

					object__keys( statement.modifies ).forEach( name => {
						const definingStatement = module.definitions[ name ];
						const exportDeclaration = module.exports[ name ] || (
							module.exports.default && module.exports.default.identifier === name && module.exports.default
						);

						const shouldMark = ( definingStatement && definingStatement.isIncluded ) ||
						                   ( exportDeclaration && exportDeclaration.isUsed );

						if ( shouldMark ) {
							settled = false;
							promises.push( statement.mark() );
							return;
						}

						// special case - https://github.com/rollup/rollup/pull/40
						const importDeclaration = module.imports[ name ];
						if ( !importDeclaration ) return;

						const promise = sander__Promise.resolve( importDeclaration.module || this.fetchModule( importDeclaration.source, module.id ) )
							.then( module => {
								if ( module.isExternal ) return null;

								importDeclaration.module = module;
								const exportDeclaration = module.exports[ importDeclaration.name ];
								// TODO things like `export default a + b` don't apply here... right?
								return module.findDefiningStatement( exportDeclaration.localName );
							})
							.then( definingStatement => {
								if ( !definingStatement ) return;

								settled = false;
								return statement.mark();
							});

						promises.push( promise );
					});
				});
			});

			return sander__Promise.all( promises ).then( () => {
				if ( !settled ) return this.markAllModifierStatements();
			});
		}

		render ( options = {} ) {
			const format = options.format || 'es6';
			const allReplacements = this.deconflict( format === 'es6' );

			// Determine export mode - 'default', 'named', 'none'
			const exportMode = getExportMode( this, options.exports );

			// If we have named exports from the bundle, and those exports
			// are assigned to *within* the bundle, we may need to rewrite e.g.
			//
			//   export let count = 0;
			//   export function incr () { count++ }
			//
			// might become...
			//
			//   exports.count = 0;
			//   function incr () {
			//     exports.count += 1;
			//   }
			//   exports.incr = incr;
			//
			// This doesn't apply if the bundle is exported as ES6!
			let allBundleExports = object__blank();
			let varExports = object__blank();

			if ( format !== 'es6' && exportMode === 'named' ) {
				object__keys( this.entryModule.exports ).forEach( key => {
					const exportDeclaration = this.entryModule.exports[ key ];

					const originalDeclaration = this.entryModule.findDeclaration( exportDeclaration.localName );

					if ( originalDeclaration && originalDeclaration.type === 'VariableDeclaration' ) {
						const canonicalName = this.trace( this.entryModule, exportDeclaration.localName, false );

						allBundleExports[ canonicalName ] = `exports.${key}`;
						varExports[ key ] = true;
					}
				});
			}

			// since we're rewriting variable exports, we want to
			// ensure we don't try and export them again at the bottom
			this.toExport = object__keys( this.entryModule.exports )
				.filter( key => !varExports[ key ] );


			let magicString = new MagicString.Bundle({ separator: '\n\n' });

			this.orderedModules.forEach( module => {
				const source = module.render( allBundleExports, allReplacements[ module.id ], format );
				if ( source.toString().length ) {
					magicString.addSource( source );
				}
			});

			// prepend bundle with internal namespaces
			const indentString = magicString.getIndentString();
			const namespaceBlock = this.internalNamespaceModules.map( module => {
				const exportKeys = object__keys( module.exports );

				return `var ${module.replacements['*']} = {\n` +
					exportKeys.map( key => {
						let actualModule = module;
						let exportDeclaration = module.exports[ key ];

						// special case - `export { default as foo } from './foo'`
						while ( exportDeclaration.linkedImport ) {
							actualModule = exportDeclaration.linkedImport.module;
							exportDeclaration = actualModule.exports[ exportDeclaration.linkedImport.name ];
						}

						let localName = exportDeclaration.localName;
						localName = actualModule.replacements[ localName ] || localName;
						return `${indentString}get ${key} () { return ${localName}; }`; // TODO...
					}).join( ',\n' ) +
				`\n};\n\n`;
			}).join( '' );

			magicString.prepend( namespaceBlock );

			const finalise = finalisers[ format ];

			if ( !finalise ) {
				throw new Error( `You must specify an output type - valid options are ${object__keys( finalisers ).join( ', ' )}` );
			}

			magicString = finalise( this, magicString.trim(), {
				// Determine export mode - 'default', 'named', 'none'
				exportMode,

				// Determine indentation
				indentString: utils_getIndentString__getIndentString( magicString, options )
			}, options );

			if ( options.banner ) magicString.prepend( options.banner + '\n' );
			if ( options.footer ) magicString.append( '\n' + options.footer );

			const code = magicString.toString();
			let map = null;

			if ( options.sourceMap ) {
				const file = options.sourceMapFile || options.dest;
				map = magicString.generateMap({
					includeContent: true,
					file
					// TODO
				});

				map.sources = map.sources.map( unixizePath );
			}

			return { code, map };
		}

		sort () {
			let seen = {};
			let ordered = [];
			let hasCycles;

			let strongDeps = {};
			let stronglyDependsOn = {};

			function visit ( module ) {
				seen[ module.id ] = true;

				const { strongDependencies, weakDependencies } = module.consolidateDependencies();

				strongDeps[ module.id ] = [];
				stronglyDependsOn[ module.id ] = {};

				object__keys( strongDependencies ).forEach( id => {
					const imported = strongDependencies[ id ];

					strongDeps[ module.id ].push( imported );

					if ( seen[ id ] ) {
						// we need to prevent an infinite loop, and note that
						// we need to check for strong/weak dependency relationships
						hasCycles = true;
						return;
					}

					visit( imported );
				});

				object__keys( weakDependencies ).forEach( id => {
					const imported = weakDependencies[ id ];

					if ( seen[ id ] ) {
						// we need to prevent an infinite loop, and note that
						// we need to check for strong/weak dependency relationships
						hasCycles = true;
						return;
					}

					visit( imported );
				});

				// add second (and third...) order dependencies
				function addStrongDependencies ( dependency ) {
					if ( stronglyDependsOn[ module.id ][ dependency.id ] ) return;

					stronglyDependsOn[ module.id ][ dependency.id ] = true;
					strongDeps[ dependency.id ].forEach( addStrongDependencies );
				}

				strongDeps[ module.id ].forEach( addStrongDependencies );

				ordered.push( module );
			}

			visit( this.entryModule );

			if ( hasCycles ) {
				let unordered = ordered;
				ordered = [];

				// unordered is actually semi-ordered, as [ fewer dependencies ... more dependencies ]
				unordered.forEach( module => {
					// ensure strong dependencies of `module` that don't strongly depend on `module` go first
					strongDeps[ module.id ].forEach( place );

					function place ( dep ) {
						if ( !stronglyDependsOn[ dep.id ][ module.id ] && !~ordered.indexOf( dep ) ) {
							strongDeps[ dep.id ].forEach( place );
							ordered.push( dep );
						}
					}

					if ( !~ordered.indexOf( module ) ) {
						ordered.push( module );
					}
				});
			}

			return ordered;
		}

		trace ( module, localName, es6 ) {
			const importDeclaration = module.imports[ localName ];

			// defined in this module
			if ( !importDeclaration ) {
				if ( localName === 'default' ) return module.defaultName();
				return module.replacements[ localName ] || localName;
			}

			// defined elsewhere
			const otherModule = importDeclaration.module;

			if ( otherModule.isExternal ) {
				if ( importDeclaration.name === 'default' ) {
					return otherModule.needsNamed && !es6 ?
						`${otherModule.name}__default` :
						otherModule.name;
				}

				if ( importDeclaration.name === '*' ) {
					return otherModule.name;
				}

				return es6 ?
					importDeclaration.name :
					`${otherModule.name}.${importDeclaration.name}`;
			}

			if ( importDeclaration.name === '*' ) {
				return otherModule.replacements[ '*' ];
			}

			if ( importDeclaration.name === 'default' ) {
				return otherModule.defaultName();
			}

			const exportDeclaration = otherModule.exports[ importDeclaration.name ];
			if ( exportDeclaration ) return this.trace( otherModule, exportDeclaration.localName );

			for ( let i = 0; i < otherModule.exportDelegates.length; i += 1 ) {
				const delegate = otherModule.exportDelegates[i];
				const delegateExportDeclaration = delegate.module.exports[ importDeclaration.name ];

				if ( delegateExportDeclaration ) {
					return this.trace( delegate.module, delegateExportDeclaration.localName );
				}
			}

			throw new Error( 'Could not trace binding' );
		}
	}

	let _rollup__SOURCEMAPPING_URL = 'sourceMa';
	_rollup__SOURCEMAPPING_URL += 'ppingURL';

	function rollup ( options ) {
		if ( !options || !options.entry ) {
			throw new Error( 'You must supply options.entry to rollup' );
		}

		const bundle = new Bundle( options );

		return bundle.build().then( () => {
			return {
				imports: bundle.externalModules.map( module => module.id ),
				exports: object__keys( bundle.entryModule.exports ),

				generate: options => bundle.render( options ),
				write: options => {
					if ( !options || !options.dest ) {
						throw new Error( 'You must supply options.dest to bundle.write' );
					}

					const dest = options.dest;
					let { code, map } = bundle.render( options );

					let promises = [];

					if ( options.sourceMap ) {
						let url;

						if ( options.sourceMap === 'inline' ) {
							url = map.toUrl();
						} else {
							url = `${basename( dest )}.map`;
							promises.push( writeFile( dest + '.map', map.toString() ) );
						}

						code += `\n//# ${_rollup__SOURCEMAPPING_URL}=${url}`;
					}

					promises.push( writeFile( dest, code ) );
					return Promise.all( promises );
				}
			};
		});
	}

	function hasNamedImports(mod) {
		var i = mod.imports.length;

		while (i--) {
			if (mod.imports[i].isNamed) {
				return true;
			}
		}
	}

	function hasNamedExports(mod) {
		var i = mod.exports.length;

		while (i--) {
			if (!mod.exports[i].isDefault) {
				return true;
			}
		}
	}

	var utils_ast_walk = utils_ast_walk__walk;

	var utils_ast_walk__shouldSkip = undefined;
	var utils_ast_walk__shouldAbort = undefined;
	function utils_ast_walk__walk(ast, _ref) {
		var enter = _ref.enter;
		var leave = _ref.leave;

		utils_ast_walk__shouldAbort = false;
		utils_ast_walk__visit(ast, null, enter, leave);
	}

	var utils_ast_walk__context = {
		skip: function () {
			return utils_ast_walk__shouldSkip = true;
		},
		abort: function () {
			return utils_ast_walk__shouldAbort = true;
		}
	};

	var utils_ast_walk__childKeys = {};

	var utils_ast_walk__toString = Object.prototype.toString;

	function utils_ast_walk__isArray(thing) {
		return utils_ast_walk__toString.call(thing) === '[object Array]';
	}

	function utils_ast_walk__visit(node, parent, enter, leave) {
		if (!node || utils_ast_walk__shouldAbort) return;

		if (enter) {
			utils_ast_walk__shouldSkip = false;
			enter.call(utils_ast_walk__context, node, parent);
			if (utils_ast_walk__shouldSkip || utils_ast_walk__shouldAbort) return;
		}

		var keys = utils_ast_walk__childKeys[node.type] || (utils_ast_walk__childKeys[node.type] = Object.keys(node).filter(function (key) {
			return typeof node[key] === 'object';
		}));

		var key = undefined,
		    value = undefined,
		    i = undefined,
		    j = undefined;

		i = keys.length;
		while (i--) {
			key = keys[i];
			value = node[key];

			if (utils_ast_walk__isArray(value)) {
				j = value.length;
				while (j--) {
					utils_ast_walk__visit(value[j], node, enter, leave);
				}
			} else if (value && value.type) {
				utils_ast_walk__visit(value, node, enter, leave);
			}
		}

		if (leave && !utils_ast_walk__shouldAbort) {
			leave(node, parent);
		}
	}

	function getId(m) {
		return m.id;
	}

	function mappers__getName(m) {
		return m.name;
	}

	function quote(str) {
		return "'" + JSON.stringify(str).slice(1, -1).replace(/'/g, "\\'") + "'";
	}

	function mappers__req(path) {
		return "require(" + quote(path) + ")";
	}

	function globalify(name) {
		if (/^__dep\d+__$/.test(name)) {
			return 'undefined';
		} else {
			return "global." + name;
		}
	}

	/*
		This module traverse a module's AST, attaching scope information
		to nodes as it goes, which is later used to determine which
		identifiers need to be rewritten to avoid collisions
	*/

	function annotateAst__Scope(options) {
		options = options || {};

		this.parent = options.parent;
		this.names = options.params || [];
	}

	annotateAst__Scope.prototype = {
		add: function (name) {
			this.names.push(name);
		},

		contains: function (name, ignoreTopLevel) {
			if (ignoreTopLevel && !this.parent) {
				return false;
			}

			if (~this.names.indexOf(name)) {
				return true;
			}

			if (this.parent) {
				return this.parent.contains(name, ignoreTopLevel);
			}

			return false;
		}
	};
	function annotateAst(ast, options) {
		var trackAssignments = options && options.trackAssignments;

		var scope = new annotateAst__Scope();
		var blockScope = new annotateAst__Scope();
		var declared = {};
		var topLevelFunctionNames = [];
		var templateLiteralRanges = [];

		var envDepth = 0;

		utils_ast_walk(ast, {
			enter: function (node) {
				if (node.type === 'ImportDeclaration' || node.type === 'ExportSpecifier') {
					node._skip = true;
				}

				if (node._skip) {
					return this.skip();
				}

				switch (node.type) {
					case 'FunctionExpression':
					case 'FunctionDeclaration':

						envDepth += 1;

					// fallthrough

					case 'ArrowFunctionExpression':
						if (node.id) {
							addToScope(node);

							// If this is the root scope, this may need to be
							// exported early, so we make a note of it
							if (!scope.parent && node.type === 'FunctionDeclaration') {
								topLevelFunctionNames.push(node.id.name);
							}
						}

						var names = node.params.map(mappers__getName);

						names.forEach(function (name) {
							return declared[name] = true;
						});

						scope = node._scope = new annotateAst__Scope({
							parent: scope,
							params: names // TODO rest params?
						});

						break;

					case 'BlockStatement':
						blockScope = node._blockScope = new annotateAst__Scope({
							parent: blockScope
						});

						break;

					case 'VariableDeclaration':
						node.declarations.forEach(node.kind === 'let' ? addToBlockScope : addToScope);
						break;

					case 'ClassExpression':
					case 'ClassDeclaration':
						addToScope(node);
						break;

					case 'MemberExpression':
						!node.computed && (node.property._skip = true);
						break;

					case 'Property':
						node.key._skip = true;
						break;

					case 'TemplateLiteral':
						templateLiteralRanges.push([node.start, node.end]);
						break;

					case 'ThisExpression':
						if (envDepth === 0) {
							node._topLevel = true;
						}
						break;

					case 'AssignmentExpression':
						assignTo(node.left);
						break;

					case 'UpdateExpression':
						assignTo(node.argument);
						break;
				}
			},
			leave: function (node) {
				switch (node.type) {
					case 'FunctionExpression':
					case 'FunctionDeclaration':

						envDepth -= 1;

					// fallthrough

					case 'ArrowFunctionExpression':

						scope = scope.parent;

						break;

					case 'BlockStatement':
						blockScope = blockScope.parent;
						break;
				}
			}
		});

		function assignTo(node) {
			if (trackAssignments && node.type === 'Identifier' && node.name === trackAssignments.name) {
				// This is possibly somewhat hacky. Open to alternative approaches...
				// It will yield false positives if `foo` in `export default foo` is shadowed
				(trackAssignments._assignments || (trackAssignments._assignments = [])).push({
					scope: scope,
					node: node
				});
			}
		}

		function addToScope(declarator) {
			var name = declarator.id.name;

			scope.add(name);
			declared[name] = true;
		}

		function addToBlockScope(declarator) {
			var name = declarator.id.name;

			blockScope.add(name);
			declared[name] = true;
		}

		ast._scope = scope;
		ast._blockScope = blockScope;
		ast._topLevelNames = ast._scope.names.concat(ast._blockScope.names);
		ast._topLevelFunctionNames = topLevelFunctionNames;
		ast._declared = declared;
		ast._templateLiteralRanges = templateLiteralRanges;
	}

	/**
	 * Inspects a module and discovers/categorises import & export declarations
	 * @param {object} ast - the result of parsing `source` with acorn
	 * @param {string} source - the module's original source code
	 * @returns {object} - { imports, exports, defaultExport }
	 */
	function findImportsAndExports(ast, source) {
		var imports = [];
		var exports = [];
		var defaultExport = undefined;
		var previousDeclaration = undefined;

		ast.body.forEach(function (node) {
			var passthrough, declaration;

			if (previousDeclaration) {
				previousDeclaration.next = node.start;

				if (node.type !== 'EmptyStatement') {
					previousDeclaration = null;
				}
			}

			if (node.type === 'ImportDeclaration') {
				declaration = processImport(node);
				imports.push(declaration);
			} else if (node.type === 'ExportDefaultDeclaration') {
				declaration = processDefaultExport(node, source);
				exports.push(declaration);

				if (defaultExport) {
					throw new Error('Duplicate default exports');
				}
				defaultExport = declaration;
			} else if (node.type === 'ExportNamedDeclaration') {
				declaration = processExport(node, source);
				exports.push(declaration);

				if (node.source) {
					// it's both an import and an export, e.g.
					// `export { foo } from './bar';
					passthrough = processImport(node, true);

					passthrough.specifiers.forEach(function (e) {
						// the import in `export { default } from 'foo';`
						// is a default import
						if (e.name === 'default') {
							e.isDefault = true;
						}
					});

					imports.push(passthrough);

					declaration.passthrough = passthrough;
				}
			}

			if (declaration) {
				previousDeclaration = declaration;
			}
		});

		// catch any trailing semicolons
		if (previousDeclaration) {
			previousDeclaration.next = source.length;
			previousDeclaration.isFinal = true;
		}

		return { imports: imports, exports: exports, defaultExport: defaultExport };
	}

	/**
	 * Generates a representation of an import declaration
	 * @param {object} node - the original AST node
	 * @param {boolean} passthrough - `true` if this is an `export { foo } from 'bar'`-style declaration
	 * @returns {object}
	 */
	function processImport(node, passthrough) {
		var x = {
			module: null, // used by bundler - filled in later
			node: node,
			start: node.start,
			end: node.end,
			passthrough: !!passthrough,

			path: node.source.value,
			specifiers: node.specifiers.map(function (s) {
				if (s.type === 'ImportNamespaceSpecifier') {
					return {
						isBatch: true,
						name: s.local.name, // TODO is this line necessary?
						as: s.local.name,
						origin: null // filled in later by bundler
					};
				}

				if (s.type === 'ImportDefaultSpecifier') {
					return {
						isDefault: true,
						name: 'default',
						as: s.local.name,
						origin: null
					};
				}

				return {
					name: (!!passthrough ? s.exported : s.imported).name,
					as: s.local.name,
					origin: null
				};
			})
		};

		// TODO have different types of imports - batch, default, named
		if (x.specifiers.length === 0) {
			x.isEmpty = true;
		} else if (x.specifiers.length === 1 && x.specifiers[0].isDefault) {
			x.isDefault = true;
			x.as = x.specifiers[0].as;
		} else if (x.specifiers.length === 1 && x.specifiers[0].isBatch) {
			x.isBatch = true;
			x.as = x.specifiers[0].name;
		} else {
			x.isNamed = true;
		}

		return x;
	}

	function processDefaultExport(node, source) {
		var d = node.declaration;

		var result = {
			node: node,
			isDefault: true,
			start: node.start,
			end: node.end,
			value: source.slice(d.start, d.end),
			valueStart: d.start,
			hasDeclaration: null,
			type: null,
			name: null
		};

		// possible declaration types:
		//   * FunctionExpression  - `export default function () {...}`
		//   * FunctionDeclaration - `export default function foo () {...}`
		//   * ClassExpression     - `export default class {...}`
		//   * ClassDeclaration    - `export default class Foo {...}`
		var match = /^(Function|Class)(Declaration)?/.exec(d.type);

		if (match) {
			result.hasDeclaration = true;
			result.type = (match[2] ? 'named' : 'anon') + match[1];

			if (match[2]) {
				result.name = d.id.name;
			}
		}

		// if no match, we have an expression like `export default whatever`
		else {
				result.type = 'expression';
				result.name = 'default';
			}

		return result;
	}

	/**
	 * Generates a representation of an export declaration
	 * @param {object} node - the original AST node
	 * @param {string} source - the original source code
	 * @returns {object}
	 */
	function processExport(node, source) {
		var result = {
			node: node,
			start: node.start,
			end: node.end,
			value: null,
			valueStart: null,
			hasDeclaration: null,
			type: null,
			name: null,
			specifiers: null
		};

		var d = node.declaration;

		if (d) {
			result.hasDeclaration = true;
			result.value = source.slice(d.start, d.end);
			result.valueStart = d.start;

			// Case 1: `export var foo = 'bar'`
			if (d.type === 'VariableDeclaration') {
				result.type = 'varDeclaration';
				result.name = d.declarations[0].id.name;
			}

			// Case 2: `export function foo () {...}`
			else if (d.type === 'FunctionDeclaration') {
					result.type = 'namedFunction';
					result.name = d.id.name;
				}

				// Case 3: `export class Foo {...}`
				else if (d.type === 'ClassDeclaration') {
						result.type = 'namedClass';
						result.name = d.id.name;
					}
		}

		// Case 9: `export { foo, bar };`
		else {
				result.type = 'named';
				result.specifiers = node.specifiers.map(function (s) {
					return {
						origin: null, // filled in later by bundler
						name: s.local.name,
						as: s.exported.name
					};
				});
			}

		return result;
	}

	var hasOwnProp = Object.prototype.hasOwnProperty;

	function getUnscopedNames(mod) {
		var unscoped = [],
		    importedNames,
		    scope;

		function imported(name) {
			if (!importedNames) {
				importedNames = {};
				mod.imports.forEach(function (i) {
					!i.passthrough && i.specifiers.forEach(function (s) {
						importedNames[s.as] = true;
					});
				});
			}
			return hasOwnProp.call(importedNames, name);
		}

		utils_ast_walk(mod.ast, {
			enter: function (node) {
				// we're only interested in references, not property names etc
				if (node._skip) return this.skip();

				if (node._scope) {
					scope = node._scope;
				}

				if (node.type === 'Identifier' && !scope.contains(node.name) && !imported(node.name) && ! ~unscoped.indexOf(node.name)) {
					unscoped.push(node.name);
				}
			},

			leave: function (node) {
				if (node.type === 'Program') {
					return;
				}

				if (node._scope) {
					scope = scope.parent;
				}
			}
		});

		return unscoped;
	}

	function disallowConflictingImports(imports) {
		var usedNames = {};

		imports.forEach(function (x) {
			if (x.passthrough) return;

			if (x.as) {
				checkName(x.as);
			} else {
				x.specifiers.forEach(checkSpecifier);
			}
		});

		function checkSpecifier(s) {
			checkName(s.as);
		}

		function checkName(name) {
			if (hasOwnProp.call(usedNames, name)) {
				throw new SyntaxError('Duplicated import (\'' + name + '\')');
			}

			usedNames[name] = true;
		}
	}

	var RESERVED = 'break case class catch const continue debugger default delete do else export extends finally for function if import in instanceof let new return super switch this throw try typeof var void while with yield'.split(' ');
	var INVALID_CHAR = /[^a-zA-Z0-9_$]/g;
	var INVALID_LEADING_CHAR = /[^a-zA-Z_$]/;

	/**
	 * Generates a sanitized (i.e. valid identifier) name from a module ID
	 * @param {string} id - a module ID, or part thereof
	 * @returns {string}
	 */
	function sanitize(name) {
		name = name.replace(INVALID_CHAR, '_');

		if (INVALID_LEADING_CHAR.test(name[0]) || ~RESERVED.indexOf(name)) {
			name = '_' + name;
		}

		return name;
	}

	var pathSplitRE = /\/|\\/;
	function splitPath(path) {
		return path.split(pathSplitRE);
	}

	var SOURCEMAPPINGURL_REGEX = /^# sourceMappingURL=/;
	function getStandaloneModule(options) {
		var code = undefined,
		    ast = undefined;

		if (typeof options.source === 'object') {
			code = options.source.code;
			ast = options.source.ast;
		} else {
			code = options.source;
		}

		var toRemove = [];

		var mod = {
			body: new MagicString(code),
			ast: ast || acorn.parse(code, {
				ecmaVersion: 6,
				sourceType: 'module',
				onComment: function (block, text, start, end) {
					// sourceMappingURL comments should be removed
					if (!block && SOURCEMAPPINGURL_REGEX.test(text)) {
						toRemove.push({ start: start, end: end });
					}
				}
			})
		};

		toRemove.forEach(function (_ref) {
			var start = _ref.start;
			var end = _ref.end;
			return mod.body.remove(start, end);
		});

		var _findImportsAndExports = findImportsAndExports(mod.ast, code);

		var imports = _findImportsAndExports.imports;
		var exports = _findImportsAndExports.exports;
		var defaultExport = _findImportsAndExports.defaultExport;

		disallowConflictingImports(imports);

		mod.imports = imports;
		mod.exports = exports;
		mod.defaultExport = defaultExport;

		var conflicts = {};

		if (options.strict) {
			annotateAst(mod.ast, {
				trackAssignments: null
			});

			// TODO there's probably an easier way to get this array
			Object.keys(mod.ast._declared).concat(getUnscopedNames(mod)).forEach(function (n) {
				conflicts[n] = true;
			});
		}

		determineImportNames(imports, options.getModuleName, conflicts);

		return mod;
	}

	function determineImportNames(imports, userFn, usedNames) {
		var nameById = {};
		var inferredNames = {};

		imports.forEach(function (x) {
			var moduleId = x.path;
			var name = undefined;

			moduleId = x.path;

			// use existing value
			if (hasOwnProp.call(nameById, moduleId)) {
				x.name = nameById[moduleId];
				return;
			}

			// if user supplied a function, defer to it
			if (userFn && (name = userFn(moduleId))) {
				name = sanitize(name);

				if (hasOwnProp.call(usedNames, name)) {
					// TODO write a test for this
					throw new Error('Naming collision: module ' + moduleId + ' cannot be called ' + name);
				}
			} else {
				var parts = splitPath(moduleId);
				var i = undefined;
				var prefix = '';
				var candidate = undefined;

				do {
					i = parts.length;
					while (i-- > 0) {
						candidate = prefix + sanitize(parts.slice(i).join('__'));

						if (!hasOwnProp.call(usedNames, candidate)) {
							name = candidate;
							break;
						}
					}

					prefix += '_';
				} while (!name);
			}

			usedNames[name] = true;
			nameById[moduleId] = name;

			x.name = name;
		});

		// use inferred names for default imports, wherever they
		// don't clash with path-based names
		imports.forEach(function (x) {
			if (x.as && !hasOwnProp.call(usedNames, x.as)) {
				inferredNames[x.path] = x.as;
			}
		});

		imports.forEach(function (x) {
			if (hasOwnProp.call(inferredNames, x.path)) {
				x.name = inferredNames[x.path];
			}
		});
	}

	function transformExportDeclaration(declaration, body) {
		if (!declaration) {
			return;
		}

		var exportedValue = undefined;

		switch (declaration.type) {
			case 'namedFunction':
			case 'namedClass':
				body.remove(declaration.start, declaration.valueStart);
				exportedValue = declaration.name;
				break;

			case 'anonFunction':
			case 'anonClass':
				if (declaration.isFinal) {
					body.replace(declaration.start, declaration.valueStart, 'return ');
				} else {
					body.replace(declaration.start, declaration.valueStart, 'var __export = ');
					exportedValue = '__export';
				}

				// add semi-colon, if necessary
				// TODO body.original is an implementation detail of magic-string - there
				// should probably be an API for this sort of thing
				if (body.original[declaration.end - 1] !== ';') {
					body.insert(declaration.end, ';');
				}

				break;

			case 'expression':
				body.remove(declaration.start, declaration.next);
				exportedValue = declaration.value;
				break;

			default:
				throw new Error('Unexpected export type \'' + declaration.type + '\'');
		}

		if (exportedValue) {
			body.append('\nreturn ' + exportedValue + ';');
		}
	}

	var ABSOLUTE_PATH = /^(?:[A-Z]:)?[\/\\]/i;

	var packageResult__warned = {};
	function packageResult(bundleOrModule, body, options, methodName, isBundle) {
		// wrap output
		if (options.banner) body.prepend(options.banner);
		if (options.footer) body.append(options.footer);

		var code = body.toString();
		var map = undefined;

		if (!!options.sourceMap) {
			if (options.sourceMap !== 'inline' && !options.sourceMapFile) {
				throw new Error('You must provide `sourceMapFile` option');
			}

			if (!isBundle && !options.sourceMapSource) {
				throw new Error('You must provide `sourceMapSource` option');
			}

			var sourceMapFile = undefined;
			if (options.sourceMap === 'inline') {
				sourceMapFile = null;
			} else {
				sourceMapFile = ABSOLUTE_PATH.test(options.sourceMapFile) ? options.sourceMapFile : './' + splitPath(options.sourceMapFile).pop();
			}

			if (isBundle) {
				markBundleSourcemapLocations(bundleOrModule);
			} else {
				markModuleSourcemapLocations(bundleOrModule);
			}

			map = body.generateMap({
				includeContent: true,
				file: sourceMapFile,
				source: sourceMapFile && !isBundle ? packageResult__getRelativePath(sourceMapFile, options.sourceMapSource) : null
			});

			if (options.sourceMap === 'inline') {
				code += '\n//# sourceMa' + 'ppingURL=' + map.toUrl();
				map = null;
			} else {
				code += '\n//# sourceMa' + 'ppingURL=' + sourceMapFile + '.map';
			}
		} else {
			map = null;
		}

		return {
			code: code,
			map: map,
			toString: function () {
				if (!packageResult__warned[methodName]) {
					console.log('Warning: esperanto.' + methodName + '() returns an object with a \'code\' property. You should use this instead of using the returned value directly');
					packageResult__warned[methodName] = true;
				}

				return code;
			}
		};
	}

	function packageResult__getRelativePath(from, to) {
		var fromParts, toParts, i;

		fromParts = splitPath(from);
		toParts = splitPath(to);

		fromParts.pop(); // get dirname

		while (fromParts[0] === '.') {
			fromParts.shift();
		}

		while (fromParts[0] === toParts[0]) {
			fromParts.shift();
			toParts.shift();
		}

		if (fromParts.length) {
			i = fromParts.length;
			while (i--) fromParts[i] = '..';

			return fromParts.concat(toParts).join('/');
		} else {
			toParts.unshift('.');
			return toParts.join('/');
		}
	}

	function markBundleSourcemapLocations(bundle) {
		bundle.modules.forEach(function (mod) {
			utils_ast_walk(mod.ast, {
				enter: function (node) {
					mod.body.addSourcemapLocation(node.start);
				}
			});
		});
	}

	function markModuleSourcemapLocations(mod) {
		utils_ast_walk(mod.ast, {
			enter: function (node) {
				mod.body.addSourcemapLocation(node.start);
			}
		});
	}

	function resolveId(importPath, importerPath) {
		var resolved, importerParts, importParts;

		if (importPath[0] !== '.') {
			resolved = importPath;
		} else {
			importerParts = splitPath(importerPath);
			importParts = splitPath(importPath);

			if (importParts[0] === '.') {
				importParts.shift();
			}

			importerParts.pop(); // get dirname
			while (importParts[0] === '..') {
				importParts.shift();
				importerParts.pop();
			}

			while (importParts[0] === '.') {
				importParts.shift();
			}

			resolved = importerParts.concat(importParts).join('/');
		}

		return resolved;
	}

	function resolveAgainst(importerPath) {
		return function (importPath) {
			return resolveId(importPath, importerPath);
		};
	}

	function getImportSummary(_ref) {
		var imports = _ref.imports;
		var absolutePaths = _ref.absolutePaths;
		var name = _ref.name;

		var paths = [];
		var names = [];
		var seen = {};
		var placeholders = 0;

		imports.forEach(function (x) {
			var path = x.id || x.path; // TODO unify these

			if (!seen[path]) {
				seen[path] = true;

				paths.push(path);

				// TODO x could be an external module, or an internal one.
				// they have different shapes, resulting in the confusing
				// code below
				if (x.needsDefault || x.needsNamed || x.specifiers && x.specifiers.length) {
					while (placeholders) {
						names.push('__dep' + names.length + '__');
						placeholders--;
					}
					names.push(x.name);
				} else {
					placeholders++;
				}
			}
		});

		var ids = absolutePaths ? paths.map(function (relativePath) {
			return resolveId(relativePath, name);
		}) : paths.slice();

		return { ids: ids, paths: paths, names: names };
	}

	function processName(name) {
		return name ? quote(name) + ', ' : '';
	}

	function processIds(ids) {
		return ids.length ? '[' + ids.map(quote).join(', ') + '], ' : '';
	}

	function amdIntro(_ref) {
		var name = _ref.name;
		var imports = _ref.imports;
		var hasExports = _ref.hasExports;
		var indentStr = _ref.indentStr;
		var absolutePaths = _ref.absolutePaths;
		var useStrict = _ref.useStrict;

		var _getImportSummary = getImportSummary({ name: name, imports: imports, absolutePaths: absolutePaths });

		var ids = _getImportSummary.ids;
		var names = _getImportSummary.names;

		if (hasExports) {
			ids.unshift('exports');
			names.unshift('exports');
		}

		var intro = '\ndefine(' + processName(name) + processIds(ids) + 'function (' + names.join(', ') + ') {\n\n';

		if (useStrict) {
			intro += indentStr + '\'use strict\';\n\n';
		}

		return intro;
	}

	var defaultsMode_amd = defaultsMode_amd__amd;
	function defaultsMode_amd__amd(mod, options) {
		mod.imports.forEach(function (x) {
			mod.body.remove(x.start, x.next);
		});

		transformExportDeclaration(mod.exports[0], mod.body);

		var intro = amdIntro({
			name: options.amdName,
			imports: mod.imports,
			absolutePaths: options.absolutePaths,
			indentStr: mod.body.getIndentString(),
			useStrict: options.useStrict !== false
		});

		mod.body.trim().indent().prepend(intro).trim().append('\n\n});');

		return packageResult(mod, mod.body, options, 'toAmd');
	}

	var defaultsMode_cjs = defaultsMode_cjs__cjs;
	function defaultsMode_cjs__cjs(mod, options) {
		var seen = {};

		mod.imports.forEach(function (x) {
			if (!hasOwnProp.call(seen, x.path)) {
				var replacement = x.isEmpty ? mappers__req(x.path) + ';' : 'var ' + x.as + ' = ' + mappers__req(x.path) + ';';
				mod.body.replace(x.start, x.end, replacement);

				seen[x.path] = true;
			} else {
				mod.body.remove(x.start, x.next);
			}
		});

		var exportDeclaration = mod.exports[0];

		if (exportDeclaration) {
			switch (exportDeclaration.type) {
				case 'namedFunction':
				case 'namedClass':
					mod.body.remove(exportDeclaration.start, exportDeclaration.valueStart);
					mod.body.replace(exportDeclaration.end, exportDeclaration.end, '\nmodule.exports = ' + exportDeclaration.name + ';');
					break;

				default:
					mod.body.replace(exportDeclaration.start, exportDeclaration.valueStart, 'module.exports = ');
					break;
			}
		}

		if (options.useStrict !== false) {
			mod.body.prepend("'use strict';\n\n").trimLines();
		}

		return packageResult(mod, mod.body, options, 'toCjs');
	}

	function umdIntro(_ref) {
		var amdName = _ref.amdName;
		var name = _ref.name;
		var hasExports = _ref.hasExports;
		var imports = _ref.imports;
		var absolutePaths = _ref.absolutePaths;
		var externalDefaults = _ref.externalDefaults;
		var indentStr = _ref.indentStr;
		var strict = _ref.strict;
		var useStrict = _ref.useStrict;

		var useStrictPragma = useStrict ? ' \'use strict\';' : '';
		var intro = undefined;

		if (!hasExports && !imports.length) {
			intro = '(function (factory) {\n\t\t\t\t!(typeof exports === \'object\' && typeof module !== \'undefined\') &&\n\t\t\t\ttypeof define === \'function\' && define.amd ? define(' + processName(amdName) + 'factory) :\n\t\t\t\tfactory()\n\t\t\t}(function () {' + useStrictPragma + '\n\n\t\t\t';
		} else {
			var _getImportSummary = getImportSummary({ imports: imports, name: amdName, absolutePaths: absolutePaths });

			var ids = _getImportSummary.ids;
			var paths = _getImportSummary.paths;
			var names = _getImportSummary.names;

			var amdExport = undefined,
			    cjsExport = undefined,
			    globalExport = undefined,
			    defaultsBlock = undefined;

			if (strict) {
				cjsExport = 'factory(' + (hasExports ? ['exports'] : []).concat(paths.map(mappers__req)).join(', ') + ')';
				var globalDeps = (hasExports ? ['(global.' + name + ' = {})'] : []).concat(names.map(globalify)).join(', ');
				globalExport = 'factory(' + globalDeps + ')';

				if (hasExports) {
					ids.unshift('exports');
					names.unshift('exports');
				}

				amdExport = 'define(' + processName(amdName) + processIds(ids) + 'factory)';
				defaultsBlock = '';
				if (externalDefaults && externalDefaults.length > 0) {
					defaultsBlock = externalDefaults.map(function (x) {
						return '\t' + (x.needsNamed ? 'var ' + x.name + '__default' : x.name) + (' = (\'default\' in ' + x.name + ' ? ' + x.name + '[\'default\'] : ' + x.name + ');');
					}).join('\n') + '\n\n';
				}
			} else {
				amdExport = 'define(' + processName(amdName) + processIds(ids) + 'factory)';
				cjsExport = (hasExports ? 'module.exports = ' : '') + ('factory(' + paths.map(mappers__req).join(', ') + ')');
				globalExport = (hasExports ? 'global.' + name + ' = ' : '') + ('factory(' + names.map(globalify).join(', ') + ')');

				defaultsBlock = '';
			}

			intro = '(function (global, factory) {\n\t\t\t\ttypeof exports === \'object\' && typeof module !== \'undefined\' ? ' + cjsExport + ' :\n\t\t\t\ttypeof define === \'function\' && define.amd ? ' + amdExport + ' :\n\t\t\t\t' + globalExport + '\n\t\t\t}(this, function (' + names.join(', ') + ') {' + useStrictPragma + '\n\n\t\t\t' + defaultsBlock;
		}

		return intro.replace(/^\t\t\t/gm, '').replace(/\t/g, indentStr);
	}

	var EsperantoError = function (message, data) {
		var prop;

		this.message = message;
		this.stack = new Error().stack;

		for (prop in data) {
			if (data.hasOwnProperty(prop)) {
				this[prop] = data[prop];
			}
		}
	};

	EsperantoError.prototype = new Error();
	EsperantoError.prototype.constructor = EsperantoError;
	EsperantoError.prototype.name = 'EsperantoError';

	function requireName(options) {
		if (!options.name) {
			throw new EsperantoError('You must supply a `name` option for UMD modules', {
				code: 'MISSING_NAME'
			});
		}
	}

	var defaultsMode_umd = defaultsMode_umd__umd;
	function defaultsMode_umd__umd(mod, options) {
		requireName(options);

		mod.imports.forEach(function (x) {
			mod.body.remove(x.start, x.next);
		});

		var intro = umdIntro({
			hasExports: mod.exports.length > 0,
			imports: mod.imports,
			amdName: options.amdName,
			absolutePaths: options.absolutePaths,
			name: options.name,
			indentStr: mod.body.getIndentString(),
			useStrict: options.useStrict !== false
		});

		transformExportDeclaration(mod.exports[0], mod.body);

		mod.body.indent().prepend(intro).trimLines().append('\n\n}));');

		return packageResult(mod, mod.body, options, 'toUmd');
	}

	var defaultsMode = {
		amd: defaultsMode_amd,
		cjs: defaultsMode_cjs,
		umd: defaultsMode_umd
	};

	function gatherImports(imports) {
		var chains = {};
		var identifierReplacements = {};

		imports.forEach(function (x) {
			x.specifiers.forEach(function (s) {
				if (s.isBatch) {
					return;
				}

				var name = s.as;
				var replacement = x.name + (s.isDefault ? "['default']" : "." + s.name);

				if (!x.passthrough) {
					identifierReplacements[name] = replacement;
				}

				chains[name] = replacement;
			});
		});

		return [chains, identifierReplacements];
	}

	function getExportNames(exports) {
		var result = {};

		exports.forEach(function (x) {
			if (x.isDefault) return;

			if (x.hasDeclaration) {
				result[x.name] = x.name;
				return;
			}

			x.specifiers.forEach(function (s) {
				result[s.name] = s.as;
			});
		});

		return result;
	}

	/**
	 * Scans an array of imports, and determines which identifiers
	   are readonly, and which cannot be assigned to. For example
	   you cannot `import foo from 'foo'` then do `foo = 42`, nor
	   can you `import * as foo from 'foo'` then do `foo.answer = 42`
	 * @param {array} imports - the array of imports
	 * @returns {array} [ importedBindings, importedNamespaces ]
	 */
	function getReadOnlyIdentifiers(imports) {
		var importedBindings = {},
		    importedNamespaces = {};

		imports.forEach(function (x) {
			if (x.passthrough) return;

			x.specifiers.forEach(function (s) {
				if (s.isBatch) {
					importedNamespaces[s.as] = true;
				} else {
					importedBindings[s.as] = true;
				}
			});
		});

		return [importedBindings, importedNamespaces];
	}

	function disallowIllegalReassignment(node, importedBindings, importedNamespaces, scope) {
		var assignee = undefined,
		    isNamespaceAssignment = undefined;

		if (node.type === 'AssignmentExpression') {
			assignee = node.left;
		} else if (node.type === 'UpdateExpression') {
			assignee = node.argument;
		} else {
			return; // not an assignment
		}

		if (assignee.type === 'MemberExpression') {
			assignee = assignee.object;
			isNamespaceAssignment = true;
		}

		if (assignee.type !== 'Identifier') {
			return; // not assigning to a binding
		}

		var name = assignee.name;

		if (hasOwnProp.call(isNamespaceAssignment ? importedNamespaces : importedBindings, name) && !scope.contains(name)) {
			throw new Error('Illegal reassignment to import \'' + name + '\'');
		}
	}

	var replaceIdentifiers__default = replaceIdentifiers__replaceIdentifiers;
	function replaceIdentifiers__replaceIdentifiers(body, node, identifierReplacements, scope) {
		var name = node.name;
		var replacement = hasOwnProp.call(identifierReplacements, name) && identifierReplacements[name];

		// TODO unchanged identifiers shouldn't have got this far -
		// remove the `replacement !== name` safeguard once that's the case
		if (replacement && replacement !== name && !scope.contains(name, true)) {
			// rewrite
			body.replace(node.start, node.end, replacement);
		}
	}

	function rewriteExportAssignments(body, node, parent, exports, scope, capturedUpdates) {
		var assignee = undefined;

		if (node.type === 'AssignmentExpression') {
			assignee = node.left;
		} else if (node.type === 'UpdateExpression') {
			assignee = node.argument;
		} else {
			return; // not an assignment
		}

		if (assignee.type !== 'Identifier') {
			return;
		}

		var name = assignee.name;

		if (scope.contains(name, true)) {
			return; // shadows an export
		}

		if (exports && hasOwnProp.call(exports, name)) {
			var exportAs = exports[name];

			if (!!capturedUpdates) {
				capturedUpdates.push({ name: name, exportAs: exportAs });
				return;
			}

			// special case - increment/decrement operators
			if (node.operator === '++' || node.operator === '--') {
				var prefix = '';
				var suffix = ', exports.' + exportAs + ' = ' + name;
				if (parent.type !== 'ExpressionStatement') {
					if (!node.prefix) {
						suffix += ', ' + name + ' ' + (node.operator === '++' ? '-' : '+') + ' 1';
					}
					prefix += '( ';
					suffix += ' )';
				}
				body.insert(node.start, prefix);
				body.insert(node.end, suffix);
			} else {
				body.insert(node.start, 'exports.' + exportAs + ' = ');
			}
		}
	}

	function traverseAst(ast, body, identifierReplacements, importedBindings, importedNamespaces, exportNames) {
		var scope = ast._scope;
		var blockScope = ast._blockScope;
		var capturedUpdates = null;
		var previousCapturedUpdates = null;

		utils_ast_walk(ast, {
			enter: function (node, parent) {
				// we're only interested in references, not property names etc
				if (node._skip) return this.skip();

				if (node._scope) {
					scope = node._scope;
				} else if (node._blockScope) {
					blockScope = node._blockScope;
				}

				// Special case: if you have a variable declaration that updates existing
				// bindings as a side-effect, e.g. `var a = b++`, where `b` is an exported
				// value, we can't simply append `exports.b = b` to the update (as we
				// normally would) because that would be syntactically invalid. Instead,
				// we capture the change and update the export (and any others) after the
				// variable declaration
				if (node.type === 'VariableDeclaration') {
					previousCapturedUpdates = capturedUpdates;
					capturedUpdates = [];
					return;
				}

				disallowIllegalReassignment(node, importedBindings, importedNamespaces, scope);

				// Rewrite assignments to exports inside functions, to keep bindings live.
				// This call may mutate `capturedUpdates`, which is used elsewhere
				if (scope !== ast._scope) {
					rewriteExportAssignments(body, node, parent, exportNames, scope, capturedUpdates);
				}

				if (node.type === 'Identifier' && parent.type !== 'FunctionExpression') {
					replaceIdentifiers__default(body, node, identifierReplacements, scope);
				}

				// Replace top-level this with undefined ES6 8.1.1.5.4
				if (node.type === 'ThisExpression' && node._topLevel) {
					body.replace(node.start, node.end, 'undefined');
				}
			},

			leave: function (node) {
				// Special case - see above
				if (node.type === 'VariableDeclaration') {
					if (capturedUpdates.length) {
						body.insert(node.end, capturedUpdates.map(exportCapturedUpdate).join(''));
					}

					capturedUpdates = previousCapturedUpdates;
				}

				if (node._scope) {
					scope = scope.parent;
				} else if (node._blockScope) {
					blockScope = blockScope.parent;
				}
			}
		});
	}

	function exportCapturedUpdate(c) {
		return ' exports.' + c.exportAs + ' = ' + c.name + ';';
	}

	function transformBody(mod, body, options) {
		var _gatherImports = gatherImports(mod.imports);

		var chains = _gatherImports[0];
		var identifierReplacements = _gatherImports[1];

		var exportNames = getExportNames(mod.exports);

		var _getReadOnlyIdentifiers = getReadOnlyIdentifiers(mod.imports);

		// ensure no conflict with `exports`
		var importedBindings = _getReadOnlyIdentifiers[0];
		var importedNamespaces = _getReadOnlyIdentifiers[1];
		identifierReplacements.exports = transformBody__deconflict('exports', mod.ast._declared);

		traverseAst(mod.ast, body, identifierReplacements, importedBindings, importedNamespaces, exportNames);

		// Remove import statements from the body of the module
		mod.imports.forEach(function (x) {
			body.remove(x.start, x.next);
		});

		// Prepend require() statements (CommonJS output only)
		if (options.header) {
			body.prepend(options.header + '\n\n');
		}

		// Remove export statements (but keep declarations)
		mod.exports.forEach(function (x) {
			if (x.isDefault) {
				if (/^named/.test(x.type)) {
					// export default function answer () { return 42; }
					body.remove(x.start, x.valueStart);
					body.insert(x.end, '\nexports[\'default\'] = ' + x.name + ';');
				} else {
					// everything else
					body.replace(x.start, x.valueStart, 'exports[\'default\'] = ');
				}
			} else {
				switch (x.type) {
					case 'varDeclaration': // export var answer = 42; (or let)
					case 'namedFunction': // export function answer () {...}
					case 'namedClass':
						// export class answer {...}
						body.remove(x.start, x.valueStart);
						break;

					case 'named':
						// export { foo, bar };
						body.remove(x.start, x.next);
						break;

					default:
						body.replace(x.start, x.valueStart, 'exports[\'default\'] = ');
				}
			}
		});

		// Append export block (this is the same for all module types, unlike imports)
		var earlyExports = [];
		var lateExports = [];

		Object.keys(exportNames).forEach(function (name) {
			var exportAs = exportNames[name];

			if (chains.hasOwnProperty(name)) {
				// special case - a binding from another module
				if (!options._evilES3SafeReExports) {
					earlyExports.push('Object.defineProperty(exports, \'' + exportAs + '\', { enumerable: true, get: function () { return ' + chains[name] + '; }});');
				} else {
					var exportSegment = exportAs === 'default' ? "['default']" : '.' + exportAs;
					lateExports.push('exports' + exportSegment + ' = ' + chains[name] + ';');
				}
			} else if (~mod.ast._topLevelFunctionNames.indexOf(name)) {
				// functions should be exported early, in
				// case of cyclic dependencies
				earlyExports.push('exports.' + exportAs + ' = ' + name + ';');
			} else {
				lateExports.push('exports.' + exportAs + ' = ' + name + ';');
			}
		});

		// Function exports should be exported immediately after 'use strict'
		if (earlyExports.length) {
			body.trim().prepend(earlyExports.join('\n') + '\n\n');
		}

		// Everything else should be exported at the end
		if (lateExports.length) {
			body.trim().append('\n\n' + lateExports.join('\n'));
		}

		if (options.intro && options.outro) {
			body.indent().prepend(options.intro).trimLines().append(options.outro);
		}
	}

	function transformBody__deconflict(name, declared) {
		while (hasOwnProp.call(declared, name)) {
			name = '_' + name;
		}

		return name;
	}

	var strictMode_amd = strictMode_amd__amd;
	function strictMode_amd__amd(mod, options) {
		var intro = amdIntro({
			name: options.amdName,
			absolutePaths: options.absolutePaths,
			imports: mod.imports,
			indentStr: mod.body.getIndentString(),
			hasExports: mod.exports.length,
			useStrict: options.useStrict !== false
		});

		transformBody(mod, mod.body, {
			intro: intro,
			outro: '\n\n});',
			_evilES3SafeReExports: options._evilES3SafeReExports
		});

		return packageResult(mod, mod.body, options, 'toAmd');
	}

	var strictMode_cjs = strictMode_cjs__cjs;
	function strictMode_cjs__cjs(mod, options) {
		var seen = {};

		// Create block of require statements
		var importBlock = mod.imports.map(function (x) {
			if (!hasOwnProp.call(seen, x.path)) {
				seen[x.path] = true;

				if (x.isEmpty) {
					return mappers__req(x.path) + ';';
				}

				return 'var ' + x.name + ' = ' + mappers__req(x.path) + ';';
			}
		}).filter(Boolean).join('\n');

		transformBody(mod, mod.body, {
			header: importBlock,
			_evilES3SafeReExports: options._evilES3SafeReExports
		});

		if (options.useStrict !== false) {
			mod.body.prepend("'use strict';\n\n").trimLines();
		}

		return packageResult(mod, mod.body, options, 'toCjs');
	}

	var strictMode_umd = strictMode_umd__umd;
	function strictMode_umd__umd(mod, options) {
		requireName(options);

		var intro = umdIntro({
			hasExports: mod.exports.length > 0,
			imports: mod.imports,
			amdName: options.amdName,
			absolutePaths: options.absolutePaths,
			name: options.name,
			indentStr: mod.body.getIndentString(),
			strict: true,
			useStrict: options.useStrict !== false
		});

		transformBody(mod, mod.body, {
			intro: intro,
			outro: '\n\n}));',
			_evilES3SafeReExports: options._evilES3SafeReExports
		});

		return packageResult(mod, mod.body, options, 'toUmd');
	}

	var strictMode = {
		amd: strictMode_amd,
		cjs: strictMode_cjs,
		umd: strictMode_umd
	};

	// TODO rewrite with named imports/exports
	var moduleBuilders = {
		defaultsMode: defaultsMode,
		strictMode: strictMode
	};

	var deprecateMessages = {
		defaultOnly: 'options.defaultOnly has been deprecated, and is now standard behaviour. To use named imports/exports, pass `strict: true`.',
		standalone: chalk.red.bold('[DEPRECATION NOTICE] Esperanto is no longer under active development. To convert an ES6 module to another format, consider using Babel (https://babeljs.io)'),
		bundle: chalk.red.bold('[DEPRECATION NOTICE] Esperanto is no longer under active development. To bundle ES6 modules, consider using Rollup (https://github.com/rollup/rollup)')
	};

	var alreadyWarned = {
		defaultOnly: false,
		standalone: false,
		bundle: false
	};

	function transpileMethod(format) {
		if (!alreadyWarned.standalone) {
			console.error(deprecateMessages.standalone);
			alreadyWarned.standalone = true;
		}

		return function (source) {
			var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

			var mod = getStandaloneModule({
				source: source,
				getModuleName: options.getModuleName,
				strict: options.strict
			});

			if ('defaultOnly' in options && !alreadyWarned.defaultOnly) {
				// TODO link to a wiki page explaining this, or something
				console.error(deprecateMessages.defaultOnly);
				alreadyWarned.defaultOnly = true;
			}

			if (options.absolutePaths && !options.amdName) {
				throw new Error('You must specify an `amdName` in order to use the `absolutePaths` option');
			}

			var builder = undefined;

			if (!options.strict) {
				// ensure there are no named imports/exports. TODO link to a wiki page...
				if (hasNamedImports(mod) || hasNamedExports(mod)) {
					throw new Error('You must be in strict mode (pass `strict: true`) to use named imports or exports');
				}

				builder = moduleBuilders.defaultsMode[format];
			} else {
				builder = moduleBuilders.strictMode[format];
			}

			return builder(mod, options);
		};
	}

	var toAmd = transpileMethod('amd');
	var toCjs = transpileMethod('cjs');
	var toUmd = transpileMethod('umd');function esperanto__bundle(options) {
		if (options.skip) {
			throw new Error('options.skip is no longer supported');
		}

		if (!alreadyWarned.bundle) {
			console.error(deprecateMessages.bundle);
			alreadyWarned.bundle = true;
		}

		var base = options.base || process.cwd();
		var entry = _path.resolve(base, options.entry).replace(/\.js$/, '') + '.js';

		var resolvedModules = {};
		if (options.modules) {
			Object.keys(options.modules).forEach(function (file) {
				resolvedModules[_path.resolve(base, file)] = options.modules[file];
			});
		}

		return rollup({
			entry: entry,

			resolveId: function (importee, importer) {
				var noExt = importee.replace(/\.js$/, '');
				var resolved = undefined;

				if (importee[0] === '.') {
					var dir = _path.dirname(importer);
					resolved = _path.resolve(dir, noExt + '.js');
					if (resolved in resolvedModules) return resolved;

					try {
						fs.statSync(resolved);
						return resolved;
					} catch (err) {}

					resolved = _path.resolve(dir, noExt + '/index.js');
					if (resolved in resolvedModules) return resolved;

					try {
						fs.statSync(resolved);
						return resolved;
					} catch (err) {}

					throw new Error('Could not resolve ' + importee + ' from ' + importer);
				}

				resolved = _path.resolve(base, noExt + '.js');
				if (resolved in resolvedModules) return resolved;

				try {
					fs.statSync(resolved);
					return resolved;
				} catch (err) {}

				resolved = _path.resolve(base, noExt + '/index.js');
				if (resolved in resolvedModules) return resolved;

				try {
					fs.statSync(resolved);
					return resolved;
				} catch (err) {}

				if (options.resolvePath) {
					return options.resolvePath(importee, importer);
				}

				return null;
			},

			load: function (id) {
				if (id in resolvedModules) return resolvedModules[id];
				var source = fs.readFileSync(id, 'utf-8');

				return options.transform ? options.transform(source) : source;
			}
		}).then(function (bundle) {
			function transpile(format, bundleOptions) {
				if ('defaultOnly' in options && !alreadyWarned.defaultOnly) {
					// TODO link to a wiki page explaining this, or something
					console.error(deprecateMessages.defaultOnly);
					alreadyWarned.defaultOnly = true;
				}

				var result = bundle.generate({
					format: format,
					banner: bundleOptions.banner ? bundleOptions.banner.replace(/\n$/, '') : null,
					footer: bundleOptions.footer ? bundleOptions.footer.replace(/^\n/, '') : null,
					moduleName: bundleOptions.name,
					moduleId: bundleOptions.amdName,
					globals: options.names,
					exports: bundle.exports.length ? bundleOptions.strict ? 'named' : 'default' : 'none',
					useStrict: bundleOptions.useStrict,
					sourceMap: bundleOptions.sourceMap,
					sourceMapFile: bundleOptions.sourceMapFile
				});

				if (bundleOptions.sourceMap === 'inline') {
					result.code += '\n//# sourceMap';
					result.code += 'pingURL=' + result.map.toUrl();
					result.map = null;
				}

				return result;
			}

			return {
				imports: bundle.imports,
				exports: bundle.exports,

				toAmd: function (options) {
					return transpile('amd', options);
				},
				toCjs: function (options) {
					return transpile('cjs', options);
				},
				toUmd: function (options) {
					return transpile('umd', options);
				},

				concat: function (options) {
					return transpile('iife', options);
				}
			};
		});
	}

	function flattenExports(exports) {
		var flattened = [];

		exports.forEach(function (x) {
			if (x.isDefault) {
				flattened.push('default');
			} else if (x.name) {
				flattened.push(x.name);
			} else if (x.specifiers) {
				flattened.push.apply(flattened, x.specifiers.map(function (x) {
					return x.as;
				}));
			}
		});

		return flattened;
	}

	exports.bundle = esperanto__bundle;
	exports.toAmd = toAmd;
	exports.toCjs = toCjs;
	exports.toUmd = toUmd;

}));
//# sourceMappingURL=/www/ESPERANTO/esperanto/.gobble-build/03-esperantoBundle/1/esperanto.browser.js.map