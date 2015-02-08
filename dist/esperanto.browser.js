/*
	esperanto.js v0.6.11 - 2015-02-08
	http://esperantojs.org

	Released under the MIT License.
*/

(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory(require('acorn'), require('estraverse')) :
	typeof define === 'function' && define.amd ? define(['acorn', 'estraverse'], factory) :
	global.esperanto = factory(global.acorn, global.estraverse)
}(this, function (acorn, estraverse) { 'use strict';

	var hasOwnProp = Object.prototype.hasOwnProperty;

	function hasNamedImports ( mod ) {
		var i = mod.imports.length;

		while ( i-- ) {
			if ( mod.imports[i].isNamed ) {
				return true;
			}
		}
	}

	function hasNamedExports ( mod ) {
		var i = mod.exports.length;

		while ( i-- ) {
			if ( !mod.exports[i].isDefault ) {
				return true;
			}
		}
	}

	var _btoa;

	if ( typeof window !== 'undefined' && typeof window.btoa === 'function' ) {
		_btoa = window.btoa;
	} else if ( typeof Buffer === 'function' ) {
		_btoa = function ( str ) {
			return new Buffer( str ).toString( 'base64' );
		};
	} else {
		throw new Error( 'Unsupported environment' );
	}

	var btoa = _btoa;

	var SourceMap = function ( properties ) {
		this.version = 3;

		this.file           = properties.file;
		this.sources        = properties.sources;
		this.sourcesContent = properties.sourcesContent;
		this.names          = properties.names;
		this.mappings       = properties.mappings;
	};

	SourceMap.prototype = {
		toString: function () {
			return JSON.stringify( this );
		},

		toUrl: function () {
			return 'data:application/json;charset=utf-8;base64,' + btoa( this.toString() );
		}
	};

	function getRelativePath__getRelativePath ( from, to ) {
		var fromParts, toParts, i;

		fromParts = from.split( '/' );
		toParts = to.split( '/' );

		fromParts.pop(); // get dirname

		while ( fromParts[0] === toParts[0] ) {
			fromParts.shift();
			toParts.shift();
		}

		if ( fromParts.length ) {
			i = fromParts.length;
			while ( i-- ) fromParts[i] = '..';
		}

		return fromParts.concat( toParts ).join( '/' );
	}

	var Bundle = function ( options ) {
		options = options || {};

		this.intro = options.intro || '';
		this.outro = options.outro || '';
		this.separator = 'separator' in options ? options.separator : '\n';

		this.sources = [];
	};

	Bundle.prototype = {
		addSource: function ( source ) {
			if ( typeof source !== 'object' || !source.content ) {
				throw new Error( 'bundle.addSource() takes an object with a `content` property, which should be an instance of MagicString, and an optional `filename`' );
			}

			this.sources.push( source );
			return this;
		},

		append: function ( str ) {
			this.outro += str;
			return this;
		},

		clone: function () {
			var bundle = new Bundle({
				intro: this.intro,
				outro: this.outro,
				separator: this.separator
			});

			this.sources.forEach( function ( source ) {
				bundle.addSource({
					filename: source.filename,
					content: source.content.clone()
				});
			});

			return bundle;
		},

		generateMap: function ( options ) {
			var offsets = {}, encoded, encodingSeparator;

			encodingSeparator = getSemis( this.separator );

			encoded = (
				getSemis( this.intro ) +
				this.sources.map( function ( source, sourceIndex) {
					return source.content.getMappings( options.hires, sourceIndex, offsets );
				}).join( encodingSeparator ) +
				getSemis( this.outro )
			);

			return new SourceMap({
				file: options.file.split( '/' ).pop(),
				sources: this.sources.map( function ( source ) {
					return getRelativePath__getRelativePath( options.file, source.filename );
				}),
				sourcesContent: this.sources.map( function ( source ) {
					return options.includeContent ? source.content.original : null;
				}),
				names: [],
				mappings: encoded
			});
		},

		getIndentString: function () {
			var indentStringCounts = {};

			this.sources.forEach( function ( source ) {
				var indentStr = source.content.indentStr;

				if ( indentStr === null ) return;

				if ( !indentStringCounts[ indentStr ] ) indentStringCounts[ indentStr ] = 0;
				indentStringCounts[ indentStr ] += 1;
			});

			return ( Object.keys( indentStringCounts ).sort( function ( a, b ) {
				return indentStringCounts[a] - indentStringCounts[b];
			})[0] ) || '\t';
		},

		indent: function ( indentStr ) {
			if ( !indentStr ) {
				indentStr = this.getIndentString();
			}

			this.sources.forEach( function ( source ) {
				source.content.indent( indentStr, { exclude: source.indentExclusionRanges });
			});

			this.intro = this.intro.replace( /^[^\n]/gm, indentStr + '$&' );
			this.outro = this.outro.replace( /^[^\n]/gm, indentStr + '$&' );

			return this;
		},

		prepend: function ( str ) {
			this.intro = str + this.intro;
			return this;
		},

		toString: function () {
			return this.intro + this.sources.map( stringify ).join( this.separator ) + this.outro;
		},

		trimLines: function () {
			return this.trim('[\\r\\n]');
		},

		trim: function (charType) {
			return this.trimStart(charType).trimEnd(charType);
		},

		trimStart: function (charType) {
			var rx = new RegExp('^' + (charType || '\\s') + '+');
			this.intro = this.intro.replace( rx, '' );

			if ( !this.intro ) {
				var source;
				var i = 0;
				do {
					source = this.sources[i];

					if ( !source ) {
						this.outro = this.outro.replace( rx, '' );
						break;
					}

					source.content.trimStart();
					i += 1;
				} while ( source.content.str === '' );
			}

			return this;
		},

		trimEnd: function(charType) {
			var rx = new RegExp((charType || '\\s') + '+$');
			this.outro = this.outro.replace( rx, '' );

			if ( !this.outro ) {
				var source;
				var i = this.sources.length - 1;
				do {
					source = this.sources[i];

					if ( !source ) {
						this.intro = this.intro.replace( rx, '' );
						break;
					}

					source.content.trimEnd(charType);
					i -= 1;
				} while ( source.content.str === '' );
			}

			return this;
		}
	};



	function stringify ( source ) {
		return source.content.toString();
	}

	function getSemis ( str ) {
		return new Array( str.split( '\n' ).length ).join( ';' );
	}

	function guessIndent ( code ) {
		var lines, tabbed, spaced, min;

		lines = code.split( '\n' );

		tabbed = lines.filter( function ( line ) {
			return /^\t+/.test( line );
		});

		spaced = lines.filter( function ( line ) {
			return /^ {2,}/.test( line );
		});

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
		min = spaced.reduce( function ( previous, current ) {
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
		var result;

		if ( typeof value === 'number' ) {
			result = encodeInteger( value );
		} else if ( Array.isArray( value ) ) {
			result = '';
			value.forEach( function ( num ) {
				result += encodeInteger( num );
			});
		} else {
			throw new Error( 'vlq.encode accepts an integer or an array of integers' );
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

	var encode__default = encode;

	function encodeMappings ( original, str, mappings, hires, sourceIndex, offsets ) {
		var lineStart,
			locations,
			lines,
			encoded,
			inverseMappings,
			charOffset = 0,
			firstSegment = true;

		// store locations, for fast lookup
		lineStart = 0;
		locations = original.split( '\n' ).map( function ( line ) {
			var start = lineStart;
			lineStart += line.length + 1; // +1 for the newline

			return start;
		});

		inverseMappings = invert( str, mappings );

		lines = str.split( '\n' ).map( function ( line ) {
			var segments, len, char, origin, lastOrigin, i, location;

			segments = [];

			len = line.length;
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
					if ( !hires && ( origin === lastOrigin + 1 ) ) {
						// do nothing
					} else {
						location = getLocation( locations, origin );

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

		encoded = lines.map( function ( segments ) {
			var generatedCodeColumn = 0;

			return segments.map( function ( segment ) {
				var arr = [
					segment.generatedCodeColumn - generatedCodeColumn,
					segment.sourceIndex - offsets.sourceIndex,
					segment.sourceCodeLine - offsets.sourceCodeLine,
					segment.sourceCodeColumn - offsets.sourceCodeColumn
				];

				generatedCodeColumn = segment.generatedCodeColumn;
				offsets.sourceIndex = segment.sourceIndex;
				offsets.sourceCodeLine = segment.sourceCodeLine;
				offsets.sourceCodeColumn = segment.sourceCodeColumn;

				firstSegment = false;

				return encode__default( arr );
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

	function getLocation ( locations, char ) {
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

	var MagicString = function ( string ) {
		this.original = this.str = string;
		this.mappings = initMappings( string.length );

		this.indentStr = guessIndent( string );
	};

	MagicString.prototype = {
		append: function ( content ) {
			this.str += content;
			return this;
		},

		clone: function () {
			var clone, i;

			clone = new MagicString( this.original );
			clone.str = this.str;

			i = clone.mappings.length;
			while ( i-- ) {
				clone.mappings[i] = this.mappings[i];
			}

			return clone;
		},

		generateMap: function ( options ) {
			options = options || {};

			return new SourceMap({
				file: ( options.file ? options.file.split( '/' ).pop() : null ),
				sources: [ options.source ? getRelativePath__getRelativePath( options.file || '', options.source ) : null ],
				sourcesContent: options.includeContent ? [ this.original ] : [ null ],
				names: [],
				mappings: this.getMappings( options.hires, 0 )
			});
		},

		getIndentString: function () {
			return this.indentStr === null ? '\t' : this.indentStr;
		},

		getMappings: function ( hires, sourceIndex, offsets ) {
			return encodeMappings( this.original, this.str, this.mappings, hires, sourceIndex, offsets );
		},

		indent: function ( indentStr, options ) {
			var self = this,
				mappings = this.mappings,
				reverseMappings = reverse( mappings, this.str.length ),
				pattern = /^[^\n]/gm,
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

			if ( !exclusions ) {
				while ( match = pattern.exec( this.str ) ) {
					inserts.push( match.index );
				}

				this.str = this.str.replace( pattern, indentStr + '$&' );
			} else {
				while ( match = pattern.exec( this.str ) ) {
					if ( !isExcluded( match.index - 1 ) ) {
						inserts.push( match.index );
					}
				}

				this.str = this.str.replace( pattern, function ( match, index ) {
					return isExcluded( index - 1 ) ? match : indentStr + match;
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
		},

		insert: function ( index, content ) {
			if ( index === 0 ) {
				this.prepend( content );
			} else if ( index === this.original.length ) {
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
		},

		// get current location of character in original string
		locate: function ( character ) {
			var loc;

			if ( character < 0 || character > this.mappings.length ) {
				throw new Error( 'Character is out of bounds' );
			}

			loc = this.mappings[ character ];
			return ~loc ? loc : null;
		},

		locateOrigin: function ( character ) {
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
		},

		prepend: function ( content ) {
			this.str = content + this.str;
			adjust( this.mappings, 0, this.mappings.length, content.length );
			return this;
		},

		remove: function ( start, end ) {
			this.replace( start, end, '' );
			return this;
		},

		replace: function ( start, end, content ) {
			var firstChar, lastChar, d;

			firstChar = this.locate( start );
			lastChar = this.locate( end - 1 );

			if ( firstChar === null || lastChar === null ) {
				throw new Error( 'Cannot replace the same content twice' );
			}

			if ( firstChar > lastChar + 1 ) {
				throw new Error(
					'BUG! First character mapped to a position after the last character: ' +
					'[' + start + ', ' + end + '] -> [' + firstChar + ', ' + ( lastChar + 1 ) + ']'
				);
			}

			this.str = this.str.substr( 0, firstChar ) + content + this.str.substring( lastChar + 1 );

			d = content.length - ( lastChar + 1 - firstChar );

			blank( this.mappings, start, end );
			adjust( this.mappings, end, this.mappings.length, d );
			return this;
		},

		slice: function ( start, end ) {
			var firstChar, lastChar;

			firstChar = this.locate( start );
			lastChar = this.locate( end - 1 ) + 1;

			if ( firstChar === null || lastChar === null ) {
				throw new Error( 'Cannot use replaced characters as slice anchors' );
			}

			return this.str.slice( firstChar, lastChar );
		},

		toString: function () {
			return this.str;
		},

		trimLines: function() {
			return this.trim('[\\r\\n]');
		},

		trim: function (charType) {
			return this.trimStart(charType).trimEnd(charType);
		},

		trimEnd: function (charType) {
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
		},

		trimStart: function (charType) {
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
	};

	MagicString.Bundle = Bundle;

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

	function blank ( mappings, start, i ) {
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

	/*
		This module traverse a module's AST, attaching scope information
		to nodes as it goes, which is later used to determine which
		identifiers need to be rewritten to avoid collisions
	*/

	var Scope = function ( options ) {
		options = options || {};

		this.parent = options.parent;
		this.names = options.params || [];
	};

	Scope.prototype = {
		add: function ( name ) {
			this.names.push( name );
		},

		contains: function ( name, ignoreTopLevel ) {
			if ( ignoreTopLevel && !this.parent ) {
				return false;
			}

			if ( ~this.names.indexOf( name ) ) {
				return true;
			}

			if ( this.parent ) {
				return this.parent.contains( name, ignoreTopLevel );
			}

			return false;
		}
	};

	function annotateAst ( ast ) {
		var scope = new Scope(), blockScope = new Scope(), declared = {}, topLevelFunctionNames = [], templateLiteralRanges = [];

		var envDepth = 0;

		estraverse.traverse( ast, {
			enter: function ( node ) {
				if ( node.type === 'ImportDeclaration' ) {
					node._skip = true;
				}

				if ( node._skip ) {
					return this.skip();
				}

				switch ( node.type ) {
					case 'FunctionExpression':
					case 'FunctionDeclaration':

						envDepth++;

						// fallthrough

					case 'ArrowFunctionExpression':
						if ( node.id ) {
							addToScope( node );

							// If this is the root scope, this may need to be
							// exported early, so we make a note of it
							if ( !scope.parent && node.type === 'FunctionDeclaration' ) {
								topLevelFunctionNames.push( node.id.name );
							}
						}

						scope = node._scope = new Scope({
							parent: scope,
							params: node.params.map( function(x ) {return x.name} ) // TODO rest params?
						});

						break;

					case 'BlockStatement':
						blockScope = node._blockScope = new Scope({
							parent: blockScope
						});

						break;

					case 'VariableDeclaration':
						node.declarations.forEach( node.kind === 'let' ? addToBlockScope : addToScope );
						break;

					case 'ClassExpression':
					case 'ClassDeclaration':
						addToScope( node );
						break;

					case 'MemberExpression':
						if ( envDepth === 0 && node.object.type === 'ThisExpression' ) {
							throw new Error('`this` at the top level is undefined');
						}
						!node.computed && ( node.property._skip = true );
						break;

					case 'Property':
						node.key._skip = true;
						break;

					case 'TemplateLiteral':
						templateLiteralRanges.push([ node.start, node.end ]);
						break;

					case 'ThisExpression':
						if (envDepth === 0) {
							node._topLevel = true;
						}
						break;
				}
			},
			leave: function ( node ) {
				switch ( node.type ) {
					case 'FunctionExpression':
					case 'FunctionDeclaration':

						envDepth--;

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

		function addToScope ( declarator ) {
			var name = declarator.id.name;

			scope.add( name );
			declared[ name ] = true;
		}

		function addToBlockScope ( declarator ) {
			var name = declarator.id.name;

			blockScope.add( name );
			declared[ name ] = true;
		}

		ast._scope = scope;
		ast._blockScope = blockScope;
		ast._topLevelNames = ast._scope.names.concat( ast._blockScope.names );
		ast._topLevelFunctionNames = topLevelFunctionNames;
		ast._declared = declared;
		ast._templateLiteralRanges = templateLiteralRanges;
	}

	/**
	 * Inspects a module and discovers/categorises import & export declarations
	 * @param {object} mod - the module object
	 * @param {string} source - the module's original source code
	 * @param {object} ast - the result of parsing `source` with acorn
	 * @returns {array} - [ imports, exports ]
	 */
	function findImportsAndExports ( mod, source, ast ) {
		var imports = [], exports = [], previousDeclaration;

		ast.body.forEach( function(node ) {
			var passthrough, declaration;

			if ( previousDeclaration ) {
				previousDeclaration.next = node.start;

				if ( node.type !== 'EmptyStatement' ) {
					previousDeclaration = null;
				}
			}

			if ( node.type === 'ImportDeclaration' ) {
				declaration = processImport( node );
				imports.push( declaration );
			}

			else if ( node.type === 'ExportDeclaration' ) {
				declaration = processExport( node, source );
				exports.push( declaration );

				if ( declaration.isDefault ) {
					if ( mod.defaultExport ) {
						throw new Error( 'Duplicate default exports' );
					}
					mod.defaultExport = declaration;
				}

				if ( node.source ) {
					// it's both an import and an export, e.g.
					// `export { foo } from './bar';
					passthrough = processImport( node, true );
					imports.push( passthrough );

					declaration.passthrough = passthrough;
				}
			}

			if ( declaration ) {
				previousDeclaration = declaration;
			}
		});

		// catch any trailing semicolons
		if ( previousDeclaration ) {
			previousDeclaration.next = source.length;
			previousDeclaration.isFinal = true;
		}

		return [ imports, exports ];
	}

	/**
	 * Generates a representation of an import declaration
	 * @param {object} node - the original AST node
	 * @param {boolean} passthrough - `true` if this is an `export { foo } from 'bar'`-style declaration
	 * @returns {object}
	 */
	function processImport ( node, passthrough ) {
		var x = {
			id: null, // used by bundler - filled in later
			node: node,
			start: node.start,
			end: node.end,
			passthrough: !!passthrough,

			path: node.source.value,
			specifiers: node.specifiers.map( function(s ) {
				var id;

				if ( s.type === 'ImportBatchSpecifier' ) {
					return {
						isBatch: true,
						name: s.name.name,
						as: s.name.name
					};
				}

				id = s.id.name;

				return {
					isDefault: !!s.default,
					name: s.default ? 'default' : id,
					as: s.name ? s.name.name : id
				};
			})
		};

		// TODO have different types of imports - batch, default, named
		if ( x.specifiers.length === 0 ) {
			x.isEmpty = true;
		} else if ( x.specifiers.length === 1 && x.specifiers[0].isDefault ) {
			x.isDefault = true;
			x.name = x.specifiers[0].as;

		} else if ( x.specifiers.length === 1 && x.specifiers[0].isBatch ) {
			x.isBatch = true;
			x.name = x.specifiers[0].name;
		} else {
			x.isNamed = true;
		}

		return x;
	}

	/**
	 * Generates a representation of an export declaration
	 * @param {object} node - the original AST node
	 * @param {string} source - the original source code
	 * @returns {object}
	 */
	function processExport ( node, source ) {
		var result, d;

		result = {
			node: node,
			start: node.start,
			end: node.end
		};

		if ( d = node.declaration ) {
			result.value = source.slice( d.start, d.end );
			result.valueStart = d.start;

			// Case 1: `export var foo = 'bar'`
			if ( d.type === 'VariableDeclaration' ) {
				result.hasDeclaration = true; // TODO remove in favour of result.type
				result.type = 'varDeclaration';
				result.name = d.declarations[0].id.name;
			}

			// Case 2: `export function foo () {...}`
			else if ( d.type === 'FunctionDeclaration' ) {
				result.hasDeclaration = true; // TODO remove in favour of result.type
				result.type = 'namedFunction';
				result.isDefault = !!node.default;
				result.name = d.id.name;
			}

			else if ( d.type === 'FunctionExpression' ) {
				result.hasDeclaration = true; // TODO remove in favour of result.type
				result.isDefault = true;

				// Case 3: `export default function foo () {...}`
				if ( d.id ) {
					result.type = 'namedFunction';
					result.name = d.id.name;
				}

				// Case 4: `export default function () {...}`
				else {
					result.type = 'anonFunction';
				}
			}

			// Case 5: `export class Foo {...}`
			else if ( d.type === 'ClassDeclaration' ) {
				result.hasDeclaration = true; // TODO remove in favour of result.type
				result.type = 'namedClass';
				result.isDefault = !!node.default;
				result.name = d.id.name;
			}

			else if ( d.type === 'ClassExpression' ) {
				result.hasDeclaration = true; // TODO remove in favour of result.type
				result.isDefault = true;

				// Case 6: `export default class Foo {...}`
				if ( d.id ) {
					result.type = 'namedClass';
					result.name = d.id.name;
				}

				// Case 7: `export default class {...}`
				else {
					result.type = 'anonClass';
				}
			}

			// Case 8: `export default 1 + 2`
			else {
				result.type = 'expression';
				result.isDefault = true;
				result.name = 'default';
			}
		}

		// Case 9: `export { foo, bar };`
		else {
			result.type = 'named';
			result.specifiers = node.specifiers.map( function(s ) {return { name: s.id.name }}  ); // TODO as?
		}

		return result;
	}

	function getUnscopedNames ( mod ) {
		var unscoped = [], importedNames, scope;

		function imported ( name ) {
			if ( !importedNames ) {
				importedNames = {};
				mod.imports.forEach( function(i ) {
					!i.passthrough && i.specifiers.forEach( function(s ) {
						importedNames[ s.as ] = true;
					});
				});
			}
			return hasOwnProp.call( importedNames, name );
		}

		estraverse.traverse( mod.ast, {
			enter: function ( node ) {
				// we're only interested in references, not property names etc
				if ( node._skip ) return this.skip();

				if ( node._scope ) {
					scope = node._scope;
				}

				if ( node.type === 'Identifier' &&
						 !scope.contains( node.name ) &&
						 !imported( node.name ) &&
						 !~unscoped.indexOf( node.name ) ) {
					unscoped.push( node.name );
				}
			},

			leave: function ( node ) {
				if ( node.type === 'Program' ) {
					return;
				}

				if ( node._scope ) {
					scope = scope.parent;
				}
			}
		});

		return unscoped;
	}

	var reserved = 'break case class catch const continue debugger default delete do else export extends finally for function if import in instanceof let new return super switch this throw try typeof var void while with yield'.split( ' ' );

	/**
	 * Generates a sanitized (i.e. valid identifier) name from a module ID
	 * @param {string} id - a module ID, or part thereof
	 * @returns {string}
	 */
	function sanitize ( name ) {
		name = name.replace( /[^a-zA-Z0-9_$]/g, '_' );
		if ( /[^a-zA-Z_$]/.test( name[0] ) ) {
			name = '_' + name;
		}

		if ( ~reserved.indexOf( name ) ) {
			name = '_' + name;
		}

		return name;
	}

	var pathSplitRE = /\/|\\/;
	function splitPath ( path ) {
		return path.split( pathSplitRE );
	}

	function getModuleNameHelper ( userFn ) {var usedNames = arguments[1];if(usedNames === void 0)usedNames = {};
		var nameById = {}, getModuleName;

		getModuleName = function(x ) {
			var moduleId, parts, i, prefix = '', name, candidate;

			moduleId = x.path;

			// use existing value
			if ( hasOwnProp.call( nameById, moduleId ) ) {
				return nameById[ moduleId ];
			}

			// if user supplied a function, defer to it
			if ( userFn && ( name = userFn( moduleId ) ) ) {
				name = sanitize( name );

				if ( hasOwnProp.call( usedNames, name ) ) {
					// TODO write a test for this
					throw new Error( 'Naming collision: module ' + moduleId + ' cannot be called ' + name );
				}
			}

			else if ( x.isDefault || x.isBatch ) {
				name = x.name;
			}

			else {
				parts = splitPath( moduleId );
				i = parts.length;

				do {
					while ( i-- ) {
						candidate = prefix + sanitize( parts.slice( i ).join( '__' ) );

						if ( !hasOwnProp.call( usedNames, candidate ) ) {
							name = candidate;
							break;
						}
					}

					prefix += '_';
				} while ( !name );
			}

			usedNames[ name ] = true;
			nameById[ moduleId ] = name;

			return name;
		};

		return getModuleName;
	}

	function getStandaloneModule ( options ) {var $D$0;
		var mod, imports, exports, conflicts = {};

		mod = {
			body: new MagicString( options.source ),
			ast: acorn.parse( options.source, {
				ecmaVersion: 6,
				locations: true
			})
		};

		imports = ($D$0 = findImportsAndExports( mod, options.source, mod.ast ))[0], exports = $D$0[1], $D$0;


		mod.imports = imports;
		mod.exports = exports;

		if ( options.strict ) {
			annotateAst( mod.ast );

			// TODO there's probably an easier way to get this array
			Object.keys( mod.ast._declared ).concat( getUnscopedNames( mod ) ).forEach( function(n ) {
				conflicts[n] = true;
			});
		} else {
			conflicts = mod.ast._declared;
		}

		mod.getName = getModuleNameHelper( options.getModuleName, conflicts );

		return mod;
	;$D$0 = void 0}

	function transformExportDeclaration ( declaration, body ) {
		var exportedValue;

		if ( declaration ) {
			switch ( declaration.type ) {
				case 'namedFunction':
				case 'namedClass':
					body.remove( declaration.start, declaration.valueStart );
					exportedValue = declaration.name;
					break;

				case 'anonFunction':
				case 'anonClass':
					if ( declaration.isFinal ) {
						body.replace( declaration.start, declaration.valueStart, 'return ' );
					} else {
						body.replace( declaration.start, declaration.valueStart, 'var __export = ' );
						exportedValue = '__export';
					}

					// add semi-colon, if necessary
					if ( declaration.value.slice( -1 ) !== ';' ) {
						body.insert( declaration.end, ';' );
					}

					break;

				case 'expression':
					body.remove( declaration.start, declaration.next );
					exportedValue = declaration.value;
					break;

				default:
					throw new Error( 'Unexpected export type' );
			}

			if ( exportedValue ) {
				body.append( '\nreturn ' + exportedValue + ';' );
			}
		}
	}

	var warned = {};

	function packageResult ( body, options, methodName, isBundle ) {
		var code, map;

		// wrap output
		if ( options.banner ) body.prepend( options.banner );
		if ( options.footer ) body.append( options.footer );

		code = body.toString();

		if ( !!options.sourceMap ) {
			if ( !options.sourceMapFile || ( !isBundle && !options.sourceMapSource )  ) {
				throw new Error( 'You must provide `sourceMapSource` and `sourceMapFile` options' );
			}

			var sourceMapFile = options.sourceMapFile[0] === '/' ? options.sourceMapFile : './' + splitPath( options.sourceMapFile ).pop();

			map = body.generateMap({
				includeContent: true,
				hires: true,
				file: sourceMapFile,
				source: !isBundle ? packageResult__getRelativePath( sourceMapFile, options.sourceMapSource ) : null
			});

			if ( options.sourceMap === 'inline' ) {
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
				if ( !warned[ methodName ] ) {
					console.log( 'Warning: esperanto.' + methodName + '() returns an object with a \'code\' property. You should use this instead of using the returned value directly' );
					warned[ methodName ] = true;
				}

				return code;
			}
		};
	}

	function packageResult__getRelativePath ( from, to ) {
		var fromParts, toParts, i;

		fromParts = splitPath( from );
		toParts = splitPath( to );

		fromParts.pop(); // get dirname

		while ( fromParts[0] === toParts[0] ) {
			fromParts.shift();
			toParts.shift();
		}

		if ( fromParts.length ) {
			i = fromParts.length;
			while ( i-- ) fromParts[i] = '..';

			return fromParts.concat( toParts ).join( '/' );
		} else {
			toParts.unshift( '.' );
			return toParts.join( '/' );
		}
	}

	/**
	 * Creates a template function from a template string. The template
	   may have `<%= someVar %>` interpolators, and the returned function
	   should be called with a data object e.g. `{ someVar: 'someData' }`
	 * @param {string} str - the template string
	 * @returns {function}
	 */
	function template ( str ) {
		return function ( data ) {
			return str.replace( /<%=\s*([^\s]+)\s*%>/g, function ( match, $1 ) {
				return $1 in data ? data[ $1 ] : match;
			});
		};
	}

	function resolveId ( importPath, importerPath ) {
		var resolved, importerParts, importParts;

		if ( importPath[0] !== '.' ) {
			resolved = importPath;
		} else {
			importerParts = splitPath( importerPath );
			importParts = splitPath( importPath );

			if ( importParts[0] === '.' ) {
				importParts.shift();
			}

			importerParts.pop(); // get dirname
			while ( importParts[0] === '..' ) {
				importParts.shift();
				importerParts.pop();
			}

			while ( importParts[0] === '.' ) {
				importParts.shift();
			}

			resolved = importerParts.concat( importParts ).join( '/' );
		}

		return resolved.replace( /\.js$/, '' );
	}

	function resolveAgainst ( importerPath ) {
		return function ( importPath ) {
			return resolveId( importPath, importerPath );
		};
	}

	function getId ( m ) {
		return m.id;
	}

	function getName ( m ) {
		return m.name;
	}

	function quote ( str ) {
		return "'" + JSON.stringify(str).slice(1, -1).replace(/'/g, "\\'") + "'";
	}

	function req ( path ) {
		return 'require(' + quote(path) + ')';
	}

	function globalify ( name ) {
	  	if ( /^__dep\d+__$/.test( name ) ) {
			return 'undefined';
		} else {
			return 'global.' + name;
		}
	}

	var amd__introTemplate = template( 'define(<%= amdName %><%= paths %>function (<%= names %>) {\n\n' );

	function amd__amd ( mod, body, options ) {
		var seen = {},
			importNames = [],
			importPaths = [],
			intro,
			placeholders = 0;

		// gather imports, and remove import declarations
		mod.imports.forEach( function(x ) {
			var path = options.absolutePaths ? resolveId( x.path, options.amdName ) : x.path;

			if ( !hasOwnProp.call( seen, path ) ) {
				importPaths.push( path );

				if ( x.name ) {
					while ( placeholders ) {
						importNames.push( '__dep' + importNames.length + '__' );
						placeholders--;
					}
					importNames.push( x.name );
				} else {
					placeholders++;
				}

				seen[ path ] = true;
			}

			body.remove( x.start, x.next );
		});

		transformExportDeclaration( mod.exports[0], body );

		intro = amd__introTemplate({
			amdName: options.amdName ? (("'" + (options.amdName)) + "', ") : '',
			paths: importPaths.length ? '[' + importPaths.map( quote ).join( ', ' ) + '], ' : '',
			names: importNames.join( ', ' )
		});

		body.trim()
			.prepend( "'use strict';\n\n" )
			.trim()
			.indent()
			.prepend( intro )
			.append( '\n\n});' );

		return packageResult( body, options, 'toAmd' );
	}

	function cjs__cjs ( mod, body, options ) {
		var seen = {}, exportDeclaration;

		mod.imports.forEach( function(x ) {
			if ( !hasOwnProp.call( seen, x.path ) ) {
				var replacement = x.isEmpty ? (("" + (req(x.path))) + ";") : (("var " + (x.name)) + (" = " + (req(x.path))) + ";");
				body.replace( x.start, x.end, replacement );

				seen[ x.path ] = true;
			} else {
				body.remove( x.start, x.next );
			}
		});

		exportDeclaration = mod.exports[0];

		if ( exportDeclaration ) {
			switch ( exportDeclaration.type ) {
				case 'namedFunction':
				case 'namedClass':
					body.remove( exportDeclaration.start, exportDeclaration.valueStart );
					body.replace( exportDeclaration.end, exportDeclaration.end, (("\nmodule.exports = " + (exportDeclaration.node.declaration.id.name)) + ";") );
					break;

				case 'anonFunction':
				case 'anonClass':
				case 'expression':
					body.replace( exportDeclaration.start, exportDeclaration.valueStart, 'module.exports = ' );
					break;

				default:
					throw new Error( 'Unexpected export type' );
			}
		}

		body.prepend( "'use strict';\n\n" ).trimLines();

		return packageResult( body, options, 'toCjs' );
	}

	function standaloneUmdIntro ( options, indentStr ) {
		var amdName = options.amdName ?
			quote(options.amdName) + ", " :
			'';

		var intro =
	(("(function (factory) {\
\n		!(typeof exports === 'object' && typeof module !== 'undefined') &&\
\n		typeof define === 'function' && define.amd ? define(" + amdName) + "factory) :\
\n		factory()\
\n	}(function () { 'use strict';\
\n\
\n	");

		return intro.replace( /\t/g, indentStr );
	}

	function defaultUmdIntro ( options, indentStr ) {
		var hasExports = options.hasExports;

		var amdName = options.amdName ?
			quote(options.amdName) + ", " :
			'';
		var amdDeps = options.importPaths.length > 0 ?
			'[' + ( options.absolutePaths ? options.importPaths.map( resolveAgainst( options.amdName ) ) : options.importPaths ).map( quote ).join( ', ' ) + '], ' :
			'';
		var cjsDeps = options.importPaths.map( req ).join( ', ' );
		var globalDeps = options.importNames.map( globalify ).join( ', ' );
		var args = options.importNames.join( ', ' );

		var cjsExport =
			(hasExports ? 'module.exports = ' : '') + (("factory(" + cjsDeps) + ")");

		var globalExport =
			(hasExports ? (("global." + (options.name)) + " = ") : '') + (("factory(" + globalDeps) + ")");


		var intro =
	(("(function (global, factory) {\
\n		typeof exports === 'object' && typeof module !== 'undefined' ? " + cjsExport) + (" :\
\n		typeof define === 'function' && define.amd ? define(" + amdName) + ("" + amdDeps) + ("factory) :\
\n		" + globalExport) + ("\
\n	}(this, function (" + args) + ") { 'use strict';\
\n\
\n	");

		return intro.replace( /\t/g, indentStr );
	}

	var EsperantoError = function ( message, data ) {
		var prop;

		this.message = message;
		this.stack = (new Error()).stack;

		for ( prop in data ) {
			if ( data.hasOwnProperty( prop ) ) {
				this[ prop ] = data[ prop ];
			}
		}
	};

	EsperantoError.prototype = new Error();
	EsperantoError.prototype.constructor = EsperantoError;
	EsperantoError.prototype.name = 'EsperantoError';

	function requireName ( options ) {
		if ( !options.name ) {
			throw new EsperantoError( 'You must supply a `name` option for UMD modules', {
				code: 'MISSING_NAME'
			});
		}
	}

	function umd__umd ( mod, body, options ) {
		var importNames = [];
		var importPaths = [];
		var seen = {};
		var placeholders = 0;

		requireName( options );

		var hasImports = mod.imports.length > 0;
		var hasExports = mod.exports.length > 0;

		var intro;
		if (!hasImports && !hasExports) {
			intro = standaloneUmdIntro({
				amdName: options.amdName,
			}, body.getIndentString() );
		} else {
			// gather imports, and remove import declarations
			mod.imports.forEach( function(x ) {
				if ( !hasOwnProp.call( seen, x.path ) ) {
					importPaths.push( x.path );

					if ( x.name ) {
						while ( placeholders ) {
							importNames.push( '__dep' + importNames.length + '__' );
							placeholders--;
						}
						importNames.push( x.name );
					} else {
						placeholders++;
					}

					seen[ x.path ] = true;
				}

				body.remove( x.start, x.next );
			});

			transformExportDeclaration( mod.exports[0], body );

			intro = defaultUmdIntro({
				hasExports: hasExports,
				importPaths: importPaths,
				importNames: importNames,
				amdName: options.amdName,
				absolutePaths: options.absolutePaths,
				name: options.name
			}, body.getIndentString() );
		}

		body.indent().prepend( intro ).trimLines().append( '\n\n}));' );

		return packageResult( body, options, 'toUmd' );
	}

	var defaultsMode = {
		amd: amd__amd,
		cjs: cjs__cjs,
		umd: umd__umd
	};

	function gatherImports ( imports, getName ) {
		var chains = {}, identifierReplacements = {};

		imports.forEach( function(x ) {
			var moduleName = getName( x );

			x.specifiers.forEach( function(s ) {
				var name, replacement;

				if ( s.isBatch ) {
					return;
				}

				name = s.as;
				replacement = moduleName + ( s.isDefault ? ("['default']") : ("." + (s.name)) );

				if ( !x.passthrough ) {
					identifierReplacements[ name ] = replacement;
				}

				chains[ name ] = replacement;
			});
		});

		return [ chains, identifierReplacements ];
	}

	function getExportNames ( exports ) {
		var result = {};

		exports.forEach( function(x ) {
			if ( x.isDefault ) return;

			if ( x.hasDeclaration ) {
				result[ x.name ] = x.name;
				return;
			}

			x.specifiers.forEach( function(s ) {
				result[ s.name ] = s.name;
			});
		});

		return result;
	}

	/**
	 * Scans an array of imports, and determines which identifiers
	   are readonly, and which cannot be assigned to. For example
	   you cannot `import foo from 'foo'` then do `foo = 42`, nor
	   can you `import * from 'foo'` then do `foo.answer = 42`
	 * @param {array} imports - the array of imports
	 * @returns {array} [ importedBindings, importedNamespaces ]
	 */
	function getReadOnlyIdentifiers ( imports ) {
		var importedBindings = {}, importedNamespaces = {};

		imports.forEach( function(x ) {
			if ( x.passthrough ) return;

			x.specifiers.forEach( function(s ) {
				if ( s.isBatch ) {
					importedNamespaces[ s.as ] = true;
				} else {
					importedBindings[ s.as ] = true;
				}
			});
		});

		return [ importedBindings, importedNamespaces ];
	}

	var bindingMessage = 'Cannot reassign imported binding ',
		namespaceMessage = 'Cannot reassign imported binding of namespace ';

	function disallowIllegalReassignment ( node, importedBindings, importedNamespaces, scope ) {
		var assignee, name, isNamespaceAssignment;

		if ( node.type === 'AssignmentExpression' ) {
			assignee = node.left;
		} else if ( node.type === 'UpdateExpression' ) {
			assignee = node.argument;
		} else {
			return; // not an assignment
		}

		if ( assignee.type === 'MemberExpression' ) {
			assignee = assignee.object;
			isNamespaceAssignment = true;
		}

		if ( assignee.type !== 'Identifier' ) {
			return; // not assigning to a binding
		}

		name = assignee.name;

		if ( hasOwnProp.call( isNamespaceAssignment ? importedNamespaces : importedBindings, name ) && !scope.contains( name ) ) {
			throw new Error( ( isNamespaceAssignment ? namespaceMessage : bindingMessage ) + '`' + name + '`' );
		}
	}

	function rewriteIdentifiers ( body, node, identifierReplacements, scope ) {
		var name, replacement;

		if ( node.type === 'Identifier' ) {
			name = node.name;
			replacement = hasOwnProp.call( identifierReplacements, name ) && identifierReplacements[ name ];

			// TODO unchanged identifiers shouldn't have got this far -
			// remove the `replacement !== name` safeguard once that's the case
			if ( replacement && replacement !== name && !scope.contains( name, true ) ) {
				// rewrite
				body.replace( node.start, node.end, replacement );
			}
		}
	}

	function rewriteExportAssignments ( body, node, exports, scope, alreadyExported, isTopLevelNode, capturedUpdates ) {
		var assignee, name, exportAs;

		if ( node.type === 'AssignmentExpression' ) {
			assignee = node.left;
		} else if ( node.type === 'UpdateExpression' ) {
			assignee = node.argument;
		} else {
			return; // not an assignment
		}

		if ( assignee.type !== 'Identifier' ) {
			return;
		}

		name = assignee.name;

		if ( scope.contains( name, true ) ) {
			return; // shadows an export
		}

		if ( exports && hasOwnProp.call( exports, name ) && ( exportAs = exports[ name ] ) ) {
			if ( !!capturedUpdates ) {
				capturedUpdates.push({
					name: name,
					exportAs: exportAs
				});
				return;
			}

			// special case - increment/decrement operators
			if ( node.operator === '++' || node.operator === '--' ) {
				body.replace( node.end, node.end, ((", exports." + exportAs) + (" = " + name) + "") );
			} else {
				body.replace( node.start, node.start, (("exports." + exportAs) + " = ") );
			}

			// keep track of what we've already exported - we don't need to
			// export it again later
			if ( isTopLevelNode ) {
				alreadyExported[ name ] = true;
			}
		}
	}

	function traverseAst ( ast, body, identifierReplacements, importedBindings, importedNamespaces, exportNames, alreadyExported ) {
		var scope = ast._scope,
			blockScope = ast._blockScope,
			capturedUpdates = null,
			previousCapturedUpdates = null;

		estraverse.traverse( ast, {
			enter: function ( node ) {
				// we're only interested in references, not property names etc
				if ( node._skip ) return this.skip();

				if ( node._scope ) {
					scope = node._scope;
				} else if ( node._blockScope ) {
					blockScope = node._blockScope;
				}

				// Special case: if you have a variable declaration that updates existing
				// bindings as a side-effect, e.g. `var a = b++`, where `b` is an exported
				// value, we can't simply append `exports.b = b` to the update (as we
				// normally would) because that would be syntactically invalid. Instead,
				// we capture the change and update the export (and any others) after the
				// variable declaration
				if ( node.type === 'VariableDeclaration' ) {
					previousCapturedUpdates = capturedUpdates;
					capturedUpdates = [];
					return;
				}

				// Catch illegal reassignments
				disallowIllegalReassignment( node, importedBindings, importedNamespaces, scope );

				// Rewrite assignments to exports. This call may mutate `alreadyExported`
				// and `capturedUpdates`, which are used elsewhere
				rewriteExportAssignments( body, node, exportNames, scope, alreadyExported, scope === ast._scope, capturedUpdates );

				// Replace identifiers
				rewriteIdentifiers( body, node, identifierReplacements, scope );

				// Replace top-level this with undefined ES6 8.1.1.5.4
				if ( node.type === 'ThisExpression' && node._topLevel ) {
					body.replace( node.start, node.end, 'undefined' );
				}
			},

			leave: function ( node ) {
				// Special case - see above
				if ( node.type === 'VariableDeclaration' ) {
					if ( capturedUpdates.length ) {
						body.insert( node.end, capturedUpdates.map( exportCapturedUpdate ).join( '' ) );
					}

					capturedUpdates = previousCapturedUpdates;
				}

				if ( node._scope ) {
					scope = scope.parent;
				} else if ( node._blockScope ) {
					blockScope = blockScope.parent;
				}
			}
		});
	}

	function exportCapturedUpdate ( c ) {
		return ((" exports." + (c.name)) + (" = " + (c.exportAs)) + ";");
	}

	function transformBody ( mod, body, options ) {var $D$1;
		var chains,
			identifierReplacements,
			importedBindings = {},
			importedNamespaces = {},
			exportNames,
			alreadyExported = {},
			earlyExports,
			lateExports;

		chains = ($D$1 = gatherImports( mod.imports, mod.getName ))[0], identifierReplacements = $D$1[1], $D$1;
		exportNames = getExportNames( mod.exports );

		importedBindings = ($D$1 = getReadOnlyIdentifiers( mod.imports ))[0], importedNamespaces = $D$1[1], $D$1;

		// ensure no conflict with `exports`
		identifierReplacements.exports = deconflict( 'exports', mod.ast._declared );

		traverseAst( mod.ast, body, identifierReplacements, importedBindings, importedNamespaces, exportNames, alreadyExported );

		// Remove import statements from the body of the module
		mod.imports.forEach( function(x ) {
			if ( x.passthrough ) {
				// this is an `export { foo } from './bar'` statement -
				// it will be dealt with in the next section
				return;
			}

			body.remove( x.start, x.next );
		});

		// Prepend require() statements (CommonJS output only)
		if ( options.header ) {
			body.prepend( options.header + '\n\n' );
		}

		// Remove export statements (but keep declarations)
		mod.exports.forEach( function(x ) {
			switch ( x.type ) {
				case 'varDeclaration': // export var answer = 42;
					body.remove( x.start, x.valueStart );
					return;

				case 'namedFunction':
				case 'namedClass':
					if ( x.isDefault ) {
						// export default function answer () { return 42; }
						body.remove( x.start, x.valueStart );
						body.insert( x.end, (("\nexports['default'] = " + (x.name)) + ";") );
					} else {
						// export function answer () { return 42; }
						body.remove( x.start, x.valueStart );
					}
					return;

				case 'anonFunction':   // export default function () {}
				case 'anonClass':      // export default class () {}
				case 'expression':     // export default 40 + 2;
					body.replace( x.start, x.valueStart, 'exports[\'default\'] = ' );
					return;

				case 'named':          // export { foo, bar };
					body.remove( x.start, x.next );
					break;

				default:
					throw new Error( 'Unknown export type: ' + x.type );
			}
		});

		// Append export block (this is the same for all module types, unlike imports)
		earlyExports = [];
		lateExports = [];

		Object.keys( exportNames ).forEach( function(name ) {
			var exportAs = exportNames[ name ];

			if ( chains.hasOwnProperty( name ) ) {
				// special case - a binding from another module
				if ( !options._evilES3SafeReExports ) {
					earlyExports.push( (("Object.defineProperty(exports, '" + exportAs) + ("', { enumerable: true, get: function () { return " + (chains[name])) + "; }});") );
				} else {
					lateExports.push( (("exports." + exportAs) + (" = " + (chains[name])) + ";") );
				}
			} else if ( ~mod.ast._topLevelFunctionNames.indexOf( name ) ) {
				// functions should be exported early, in
				// case of cyclic dependencies
				earlyExports.push( (("exports." + exportAs) + (" = " + name) + ";") );
			} else if ( !alreadyExported.hasOwnProperty( name ) ) {
				lateExports.push( (("exports." + exportAs) + (" = " + name) + ";") );
			}
		});

		// Function exports should be exported immediately after 'use strict'
		if ( earlyExports.length ) {
			body.trim().prepend( earlyExports.join( '\n' ) + '\n\n' );
		}

		// Everything else should be exported at the end
		if ( lateExports.length ) {
			body.trim().append( '\n\n' + lateExports.join( '\n' ) );
		}

		if ( options.intro && options.outro ) {
			body.indent().prepend( options.intro ).trimLines().append( options.outro );
		}
	;$D$1 = void 0}

	function deconflict ( name, declared ) {
		while ( hasOwnProp.call( declared, name ) ) {
			name = '_' + name;
		}

		return name;
	}

	function getImportSummary ( mod ) {
		var importPaths = [], importNames = [], seen = {}, placeholders = 0;

		mod.imports.forEach( function(x ) {
			if ( !hasOwnProp.call( seen, x.path ) ) {
				importPaths.push( x.path );

				if ( x.specifiers.length ) {
					while ( placeholders ) {
						importNames.push( '__dep' + importNames.length + '__' );
						placeholders--;
					}
					importNames.push( mod.getName( x ) );
				} else {
					placeholders++;
				}

				seen[ x.path ] = true;
			}
		});

		return [ importPaths, importNames ];
	}

	var strictMode_amd__introTemplate;

	strictMode_amd__introTemplate = template( 'define(<%= amdName %><%= paths %>function (<%= names %>) {\n\n\t\'use strict\';\n\n' );

	function strictMode_amd__amd ( mod, body, options ) {var $D$2;
		var importPaths,
			importNames,
			intro;

		importPaths = ($D$2 = getImportSummary( mod ))[0], importNames = $D$2[1], $D$2;

		if ( mod.exports.length ) {
			importPaths.unshift( 'exports' );
			importNames.unshift( 'exports' );
		}

		intro = strictMode_amd__introTemplate({
			amdName: options.amdName ? (("'" + (options.amdName)) + "', ") : '',
			paths: importPaths.length ? '[' + ( options.absolutePaths ? importPaths.map( resolveAgainst( options.amdName ) ) : importPaths ).map( quote ).join( ', ' ) + '], ' : '',
			names: importNames.join( ', ' )
		}).replace( /\t/g, body.getIndentString() );

		transformBody( mod, body, {
			intro: intro,
			outro: '\n\n});',
			_evilES3SafeReExports: options._evilES3SafeReExports
		});

		return packageResult( body, options, 'toAmd' );
	;$D$2 = void 0}

	function strictMode_cjs__cjs ( mod, body, options ) {
		var importBlock, seen = {};

		// Create block of require statements
		importBlock = mod.imports.map( function(x ) {
			var name, replacement;

			if ( !hasOwnProp.call( seen, x.path ) ) {
				if ( x.isEmpty ) {
					replacement = (("" + (req(x.path))) + ";");
				} else {
					name = mod.getName( x );
					replacement = (("var " + name) + (" = " + (req(x.path))) + ";");
				}

				seen[ x.path ] = true;
			}

			return replacement;
		}).filter( Boolean ).join( '\n' );

		transformBody( mod, body, {
			header: importBlock,
			_evilES3SafeReExports: options._evilES3SafeReExports
		});

		body.prepend( "'use strict';\n\n" ).trimLines();

		return packageResult( body, options, 'toCjs' );
	}

	function strictUmdIntro ( options, indentStr ) {
		var hasExports = options.hasExports;

		var amdName = options.amdName ?
			"'" + options.amdName + "', " :
			'';
		var amdDeps = hasExports || options.importPaths.length > 0 ?
			'[' +
				( hasExports ? [ 'exports' ] : [] ).concat( options.absolutePaths ? options.importPaths.map( resolveAgainst( options.amdName ) ) : options.importPaths ).map( quote ).join( ', ' ) +
			'], ' :
			'';
		var cjsDeps = ( hasExports ? [ 'exports' ] : [] ).concat( options.importPaths.map( req ) ).join( ', ' );
		var globalDeps = ( hasExports ? [ (("(global." + (options.name)) + " = {})") ] : [] )
			.concat( options.importNames.map( globalify ) ).join( ', ' );
		var args = ( hasExports ? [ 'exports' ] : [] ).concat( options.importNames ).join( ', ' );

		var defaultsBlock = '';
		if ( options.externalDefaults && options.externalDefaults.length > 0 ) {
			defaultsBlock = options.externalDefaults.map( function(x )
				{return '\t' + ( x.needsNamed ? (("var " + (x.name)) + "__default") : x.name ) +
					((" = ('default' in " + (x.name)) + (" ? " + (x.name)) + ("['default'] : " + (x.name)) + ");")}
			).join('\n') + '\n\n';
		}

		var intro =
	(("(function (global, factory) {\
\n		typeof exports === 'object' && typeof module !== 'undefined' ? factory(" + cjsDeps) + (") :\
\n		typeof define === 'function' && define.amd ? define(" + amdName) + ("" + amdDeps) + ("factory) :\
\n		factory(" + globalDeps) + (")\
\n	}(this, function (" + args) + (") { 'use strict';\
\n\
\n	" + defaultsBlock) + "");

		return intro.replace( /\t/g, indentStr );
	}

	function strictMode_umd__umd ( mod, body, options ) {
		requireName( options );

		var importPaths = (importNames = getImportSummary( mod ))[0], importNames = importNames[1];

		var hasImports = mod.imports.length > 0;
		var hasExports = mod.exports.length > 0;

		var intro;
		if (!hasImports && !hasExports) {
			intro = standaloneUmdIntro({
				amdName: options.amdName,
			}, body.getIndentString() );
		} else {
			intro = strictUmdIntro({
				hasExports: hasExports,
				importPaths: importPaths,
				importNames: importNames,
				amdName: options.amdName,
				absolutePaths: options.absolutePaths,
				name: options.name
			}, body.getIndentString() );
		}

		transformBody( mod, body, {
			intro: intro,
			outro: '\n\n}));',
			_evilES3SafeReExports: options._evilES3SafeReExports
		});

		return packageResult( body, options, 'toUmd' );
	}

	var strictMode = {
		amd: strictMode_amd__amd,
		cjs: strictMode_cjs__cjs,
		umd: strictMode_umd__umd
	};

	// TODO rewrite with named imports/exports
	var moduleBuilders = {
		defaultsMode: defaultsMode,
		strictMode: strictMode
	};

	var defaultsMode_amd__introTemplate = template( 'define(<%= amdName %><%= amdDeps %>function (<%= names %>) {\n\n\t\'use strict\';\n\n' );

	function defaultsMode_amd__amd ( bundle, body, options ) {
		var defaultName = bundle.entryModule.identifierReplacements.default;
		if ( defaultName ) {
			body.append( (("\n\nreturn " + defaultName) + ";") );
		}

		var intro = defaultsMode_amd__introTemplate({
			amdName: options.amdName ? (("" + (quote(options.amdName))) + ", ") : '',
			amdDeps: bundle.externalModules.length ? '[' + bundle.externalModules.map( quoteId ).join( ', ' ) + '], ' : '',
			names: bundle.externalModules.map( getName ).join( ', ' )
		}).replace( /\t/g, body.getIndentString() );

		body.indent().prepend( intro ).trimLines().append( '\n\n});' );
		return packageResult( body, options, 'toAmd', true );
	}

	function quoteId ( m ) {
		return "'" + m.id + "'";
	}

	function defaultsMode_cjs__cjs ( bundle, body, options ) {
		var importBlock = bundle.externalModules.map( function(x ) {
			return (("var " + (x.name)) + (" = " + (req(x.id))) + ";");
		}).join( '\n' );

		if ( importBlock ) {
			body.prepend( importBlock + '\n\n' );
		}

		var defaultName = bundle.entryModule.identifierReplacements.default;
		if ( defaultName ) {
			body.append( (("\n\nmodule.exports = " + defaultName) + ";") );
		}

		body.prepend("'use strict';\n\n").trimLines();

		return packageResult( body, options, 'toCjs', true );
	}

	function defaultsMode_umd__umd ( bundle, body, options ) {
		requireName( options );

		var entry = bundle.entryModule;

		var hasImports = bundle.externalModules.length > 0;
		var hasExports = entry.exports.length > 0;

		var intro;
		if (!hasImports && !hasExports) {
			intro = standaloneUmdIntro({
				amdName: options.amdName,
			}, body.getIndentString() );
		} else {

			var defaultName = entry.identifierReplacements.default;
			if ( defaultName ) {
				body.append( (("\n\nreturn " + defaultName) + ";") );
			}

			var importPaths = bundle.externalModules.map( getId );
			var importNames = bundle.externalModules.map( getName );

			intro = defaultUmdIntro({
				hasExports: hasExports,
				importPaths: importPaths,
				importNames: importNames,
				amdName: options.amdName,
				name: options.name
			}, body.getIndentString() );
		}

		body.indent().prepend( intro ).trimLines().append('\n\n}));');

		return packageResult( body, options, 'toUmd', true );
	}

	var builders_defaultsMode = {
		amd: defaultsMode_amd__amd,
		cjs: defaultsMode_cjs__cjs,
		umd: defaultsMode_umd__umd
	};

	function getExportBlock ( entry ) {
		var name = entry.identifierReplacements.default;
		return (("exports['default'] = " + name) + ";");
	}

	var builders_strictMode_amd__introTemplate = template( 'define(<%= amdName %><%= amdDeps %>function (<%= names %>) {\n\n\t\'use strict\';\n\n' );

	function builders_strictMode_amd__amd ( bundle, body, options ) {
		var externalDefaults = bundle.externalModules.filter( builders_strictMode_amd__needsDefault );
		var entry = bundle.entryModule;

		var importIds = bundle.externalModules.map( getId );
		var importNames = bundle.externalModules.map( getName );

		if ( externalDefaults.length ) {
			var defaultsBlock = externalDefaults.map( function(x ) {
				// Case 1: default is used, and named is not
				if ( !x.needsNamed ) {
					return (("" + (x.name)) + (" = ('default' in " + (x.name)) + (" ? " + (x.name)) + ("['default'] : " + (x.name)) + ");");
				}

				// Case 2: both default and named are used
				return (("var " + (x.name)) + ("__default = ('default' in " + (x.name)) + (" ? " + (x.name)) + ("['default'] : " + (x.name)) + ");");
			}).join( '\n' );

			body.prepend( defaultsBlock + '\n\n' );
		}

		if ( entry.exports.length ) {
			importIds.unshift( 'exports' );
			importNames.unshift( 'exports' );

			if ( entry.defaultExport ) {
				body.append( '\n\n' + getExportBlock( entry ) );
			}
		}

		var intro = builders_strictMode_amd__introTemplate({
			amdName: options.amdName ? (("" + (quote(options.amdName))) + ", ") : '',
			amdDeps: importIds.length ? '[' + importIds.map( quote ).join( ', ' ) + '], ' : '',
			names: importNames.join( ', ' )
		}).replace( /\t/g, body.getIndentString() );

		body.indent().prepend( intro ).trimLines().append( '\n\n});' );
		return packageResult( body, options, 'toAmd', true );
	}

	function builders_strictMode_amd__needsDefault ( externalModule ) {
		return externalModule.needsDefault;
	}

	function builders_strictMode_cjs__cjs ( bundle, body, options ) {
		var entry = bundle.entryModule;

		var importBlock = bundle.externalModules.map( function(x ) {
			var statement = (("var " + (x.name)) + (" = " + (req(x.id))) + ";");

			if ( x.needsDefault ) {
				statement += '\n' +
					( x.needsNamed ? (("var " + (x.name)) + "__default") : x.name ) +
					((" = ('default' in " + (x.name)) + (" ? " + (x.name)) + ("['default'] : " + (x.name)) + ");");
			}

			return statement;
		}).join( '\n' );

		if ( importBlock ) {
			body.prepend( importBlock + '\n\n' );
		}

		if ( entry.defaultExport ) {
			body.append( '\n\n' + getExportBlock( entry ) );
		}

		body.prepend("'use strict';\n\n").trimLines();

		return packageResult( body, options, 'toCjs', true );
	}

	function builders_strictMode_umd__umd ( bundle, body, options ) {
		requireName( options );

		var entry = bundle.entryModule;

		var hasImports = bundle.externalModules.length > 0;
		var hasExports = entry.exports.length > 0;

		var intro;
		if (!hasImports && !hasExports) {
			intro = standaloneUmdIntro({
				amdName: options.amdName,
			}, body.getIndentString() );
		} else {

			if ( hasExports && entry.defaultExport ) {
				body.append( '\n\n' + getExportBlock( entry ) );
			}

			var importPaths = bundle.externalModules.map( getId );
			var importNames = bundle.externalModules.map( getName );

			intro = strictUmdIntro({
				hasExports: hasExports,
				importPaths: importPaths,
				importNames: importNames,
				externalDefaults: bundle.externalModules.filter( builders_strictMode_umd__needsDefault ),
				amdName: options.amdName,
				name: options.name,
			}, body.getIndentString() );
		}

		body.indent().prepend( intro ).trimLines().append('\n\n}));');

		return packageResult( body, options, 'toUmd', true );
	}

	function builders_strictMode_umd__needsDefault ( externalModule ) {
		return externalModule.needsDefault;
	}

	var builders_strictMode = {
		amd: builders_strictMode_amd__amd,
		cjs: builders_strictMode_cjs__cjs,
		umd: builders_strictMode_umd__umd
	};

	// TODO rewrite with named imports/exports
	var bundleBuilders = {
		defaultsMode: builders_defaultsMode,
		strictMode: builders_strictMode
	};

	function concat ( bundle, options ) {
		var body, intro, outro, indent;

		// This bundle must be self-contained - no imports or exports
		if ( bundle.externalModules.length || bundle.entryModule.exports.length ) {
			throw new Error( (("bundle.concat() can only be used with bundles that have no imports/exports (imports: [" + (bundle.externalModules.map(function(x){return x.id}).join(', '))) + ("], exports: [" + (bundle.entryModule.exports.join(', '))) + "])") );
		}

		body = bundle.body.clone();

		// TODO test these options
		intro = 'intro' in options ? options.intro : ("(function () { 'use strict';\n\n");
		outro = 'outro' in options ? options.outro : '\n\n})();';

		if ( !( 'indent' in options ) || options.indent === true ) {
			indent = body.getIndentString();
		} else {
			indent = options.indent || '';
		}

		body.trimLines().indent( indent ).prepend( intro ).append( outro );

		return packageResult( body, options, 'toString', true );
	}

	var deprecateMessage = 'options.defaultOnly has been deprecated, and is now standard behaviour. To use named imports/exports, pass `strict: true`.',
		alreadyWarned = false;

	function transpileMethod ( format ) {
		return function ( source ) {var options = arguments[1];if(options === void 0)options = {};
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

			if ( options.absolutePaths && !options.amdName ) {
				throw new Error( 'You must specify an `amdName` in order to use the `absolutePaths` option' );
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

	var esperanto = {
		toAmd: transpileMethod( 'amd' ),
		toCjs: transpileMethod( 'cjs' ),
		toUmd: transpileMethod( 'umd' ),

		bundle: function ( options ) {
			return getBundle( options ).then( function ( bundle ) {
				return {
					imports: bundle.externalModules.map( function(mod ) {return mod.id} ),
					exports: flattenExports( bundle.entryModule.exports ),

					toAmd: function(options ) {return transpile( 'amd', options )},
					toCjs: function(options ) {return transpile( 'cjs', options )},
					toUmd: function(options ) {return transpile( 'umd', options )},

					concat: function(options ) {return concat( bundle, options || {} )}
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

						bundle.modules.forEach( function(mod ) {
							mod.imports.forEach( function(x ) {
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

	function flattenExports ( exports ) {
		var flattened = [];

		exports.forEach( function(x ) {
			if ( x.isDefault ) {
				flattened.push( 'default' );
			}

			else if ( x.name ) {
				flattened.push( x.name );
			}

			else if ( x.specifiers ) {
				flattened.push.apply( flattened, x.specifiers.map( getName ) );
			}
		});

		return flattened;
	}

	return esperanto;

}));