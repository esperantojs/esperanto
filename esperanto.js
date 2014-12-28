(function () {

 'use strict';

 var acorn__default = require('acorn');
 var MagicString__default = require('magic-string');
 var path__default = require('path');
 var sander__default = require('sander');
 var estraverse__default = require('estraverse');

	/*
		This module traverse a module's AST, attaching scope information
		to nodes as it goes, which is later used to determine which
		identifiers need to be rewritten to avoid collisions
	*/

	var annotateAst__Scope = function ( options ) {
		options = options || {};

		this.parent = options.parent;
		this.names = options.params || [];
	};

	annotateAst__Scope.prototype = {
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

	function annotateAst__annotateAst ( ast ) {
		var scope = new annotateAst__Scope(), blockScope = new annotateAst__Scope();

		estraverse__default.traverse( ast, {
			enter: function ( node ) {
				if ( node.type === 'ImportDeclaration' ) {
					node._skip = true;
				}

				if ( node._skip ) {
					return this.skip();
				}

				if ( annotateAst__createsScope( node ) ) {
					if ( node.id ) {
						scope.add( node.id.name );
					}

					scope = node._scope = new annotateAst__Scope({
						parent: scope,
						params: node.params.map( function(x ) {return x.name} ) // TODO rest params?
					});
				}

				else if ( annotateAst__createsBlockScope( node ) ) {
					blockScope = node._blockScope = new annotateAst__Scope({
						parent: blockScope
					});
				}

				if ( annotateAst__declaresVar( node ) ) {
					scope.add( node.id.name );
				}

				else if ( annotateAst__declaresLet( node ) ) {
					blockScope.add( node.id.name );
				}

				// Make a note of which children we should skip
				if ( node.type === 'MemberExpression' && !node.computed ) {
					node.property._skip = true;
				}

				else if ( node.type === 'Property' ) {
					node.key._skip = true;
				}
			},
			leave: function ( node ) {
				if ( annotateAst__createsScope( node ) ) {
					scope = scope.parent;
				}

				else if ( annotateAst__createsBlockScope( node ) ) {
					blockScope = blockScope.parent;
				}
			}
		});

		ast._scope = scope;
		ast._blockScope = blockScope;
	}
	var annotateAst__default = annotateAst__annotateAst;

	function annotateAst__createsScope ( node ) {
		return node.type === 'FunctionExpression' || node.type === 'FunctionDeclaration';
	}

	function annotateAst__createsBlockScope ( node ) {
		return node.type === 'BlockStatement';
	}

	function annotateAst__declaresVar ( node ) {
		// TODO const? (function taken care of already)
		return (
			node.type === 'VariableDeclarator' ||
			node.type === 'ClassExpression' ||
			node.type === 'ClassDeclaration'
		);
	}

	function annotateAst__declaresLet ( node ) {
		return false; // TODO
	}

	/**
	 * Inspects a module and discovers/categorises import & export declarations
	 * @param {object} mod - the module object
	 * @param {string} source - the module's original source code
	 * @param {object} ast - the result of parsing `source` with acorn
	 * @returns {array} - [ imports, exports ]
	 */
	function findImportsAndExports__findImportsAndExports ( mod, source, ast ) {
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
				declaration = findImportsAndExports__processImport( node );
				imports.push( declaration );
			}

			else if ( node.type === 'ExportDeclaration' ) {
				declaration = findImportsAndExports__processExport( node, source );
				exports.push( declaration );

				if ( declaration.default ) {
					if ( mod.defaultExport ) {
						throw new Error( 'Duplicate default exports' );
					}
					mod.defaultExport = declaration;
				}

				if ( node.source ) {
					// it's both an import and an export, e.g.
					// `export { foo } from './bar';
					passthrough = findImportsAndExports__processImport( node, true );
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
	var findImportsAndExports__default = findImportsAndExports__findImportsAndExports;

	/**
	 * Generates a representation of an import declaration
	 * @param {object} node - the original AST node
	 * @param {boolean} passthrough - `true` if this is an `export { foo } from 'bar'`-style declaration
	 * @returns {object}
	 */
	function findImportsAndExports__processImport ( node, passthrough ) {
		var result = {
			node: node,
			start: node.start,
			end: node.end,
			passthrough: !!passthrough,

			path: node.source.value,
			specifiers: node.specifiers.map( function(s ) {
				var id;

				if ( s.type === 'ImportBatchSpecifier' ) {
					return {
						batch: true,
						name: s.name.name
					};
				}

				id = s.id.name;

				return {
					default: !!s.default,
					name: s.default ? 'default' : id,
					as: s.name ? s.name.name : id
				};
			})
		};

		// TODO have different types of imports - batch, default, named

		if ( result.specifiers.length === 1 && result.specifiers[0].default ) {
			result.default = true;
			result.name = result.specifiers[0].as;
		}

		return result;
	}

	/**
	 * Generates a representation of an export declaration
	 * @param {object} node - the original AST node
	 * @param {string} source - the original source code
	 * @returns {object}
	 */
	function findImportsAndExports__processExport ( node, source ) {
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
				result.declaration = true; // TODO remove in favour of result.type
				result.type = 'varDeclaration';
				result.name = d.declarations[0].id.name;
			}

			// Case 2: `export function foo () {...}`
			else if ( d.type === 'FunctionDeclaration' ) {
				result.declaration = true; // TODO remove in favour of result.type
				result.type = 'namedFunction';
				result.default = !!node.default;
				result.name = d.id.name;
			}

			else if ( d.type === 'FunctionExpression' ) {
				result.declaration = true; // TODO remove in favour of result.type
				result.default = true;

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
				result.declaration = true; // TODO remove in favour of result.type
				result.type = 'namedClass';
				result.default = !!node.default;
				result.name = d.id.name;
			}

			else if ( d.type === 'ClassExpression' ) {
				result.declaration = true; // TODO remove in favour of result.type
				result.default = true;

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
				result.default = true;
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

	var sanitize__reserved = 'break case class catch const continue debugger default delete do else export extends finally for function if import in instanceof let new return super switch this throw try typeof var void while with yield'.split( ' ' );

	/**
	 * Generates a sanitized (i.e. valid identifier) name from a module ID
	 * @param {string} id - a module ID, or part thereof
	 * @returns {string}
	 */
	function sanitize__sanitize ( name ) {
		name = name.replace( /[^a-zA-Z0-9_$]/g, '_' );
		if ( /[^a-zA-Z_$]/.test( name[0] ) ) {
			name = '_' + name;
		}

		if ( ~sanitize__reserved.indexOf( name ) ) {
			name = '_' + name;
		}

		return name;
	}
	var sanitize__default = sanitize__sanitize;

	function getModuleNameHelper__getModuleNameHelper ( userFn, varNames ) {
		var nameById = {}, usedNames = {}, getModuleName;

		if ( varNames ) {
			varNames.forEach( function(n ) {return usedNames[n] = true} );
		}

		getModuleName = function(x ) {
			var moduleId, parts, i, prefix = '', name, candidate, specifier;

			moduleId = x.path;

			// use existing value
			if ( nameById.hasOwnProperty( moduleId ) ) {
				return nameById[ moduleId ];
			}

			// if user supplied a function, defer to it
			if ( userFn && ( name = userFn( moduleId ) ) ) {
				name = sanitize__default( name );

				if ( usedNames.hasOwnProperty( name ) ) {
					// TODO write a test for this
					throw new Error( 'Naming collision: module ' + moduleId + ' cannot be called ' + name );
				}
			}

			else if ( x.default ) {
				name = x.name;
			}

			else if ( ( specifier = x.specifiers[0] ) && specifier.batch ) {
				name = specifier.name;
			}

			else {
				parts = moduleId.split( '/' );
				i = parts.length;

				do {
					while ( i-- ) {
						candidate = prefix + sanitize__default( parts.slice( i ).join( '__' ) );

						if ( !usedNames.hasOwnProperty( candidate ) ) {
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
	var getModuleNameHelper__default = getModuleNameHelper__getModuleNameHelper;

	function getStandaloneModule__getStandaloneModule ( options ) {var $D$0;
		var mod, varNames, imports, exports;

		mod = {
			source: options.source,
			body: new MagicString__default( options.source ),
			ast: acorn__default.parse( options.source, {
				ecmaVersion: 6,
				locations: true
			})
		};

		if ( options.strict ) {
			annotateAst__default( mod.ast );
			varNames = mod.ast._scope.names.concat( mod.ast._blockScope.names );
		}

		mod.getName = getModuleNameHelper__default( options.getModuleName, varNames );

		imports = ($D$0 = findImportsAndExports__default( mod, mod.source, mod.ast ))[0], exports = $D$0[1], $D$0;

		mod.imports = imports;
		mod.exports = exports;

		return mod;
	;$D$0 = void 0}
	var getStandaloneModule__default = getStandaloneModule__getStandaloneModule;

	/**
	 * Resolves an importPath relative to the module that is importing it
	 * @param {string} importPath - the (possibly relative) path of an imported module
	 * @param {string} importerPath - the (relative to `base`) path of the importing module
	 * @returns {string}
	 */
	function resolve__resolve ( importPath, importerPath ) {
		var resolved, importerParts, importParts;

		if ( importPath[0] !== '.' ) {
			resolved = importPath;
		} else {
			importerParts = importerPath.split( '/' );
			importParts = importPath.split( '/' );

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
	var resolve__default = resolve__resolve;

	function sortModules__sortModules ( entry, moduleLookup ) {
		var seen = {},
			ordered = [];

		function visit ( mod ) {
			// ignore external modules, and modules we've
			// already included
			if ( !mod || seen.hasOwnProperty( mod.id ) ) {
				return;
			}

			seen[ mod.id ] = true;

			mod.imports.forEach( function(x ) {
				var id = resolve__default( x.path, mod.file );
				visit( moduleLookup[ id ] );
			});

			ordered.push( mod );
		}

		visit( entry );

		return ordered;
	}
	var sortModules__default = sortModules__sortModules;

	function resolveChains__resolveChains ( modules, moduleLookup ) {
		var chains = {};

		// First pass - resolving intra-module chains
		modules.forEach( function(mod ) {
			var origin = {};

			mod.imports.forEach( function(x ) {
				x.specifiers.forEach( function(s ) {
					var moduleId = resolve__default( x.path, mod.file );

					if ( s.batch ) {
						// if this is an internal module, we need to tell that module that
						// it needs to export an object full of getters
						if ( moduleLookup.hasOwnProperty( moduleId ) ) {
							moduleLookup[ moduleId ]._exportsNamespace = true;
						}

						return; // TODO can batch imports be chained?
					}

					origin[ s.as ] = moduleId + '@' + s.name;
				});
			});

			mod.exports.forEach( function(x ) {
				if ( !x.specifiers ) return;

				x.specifiers.forEach( function(s ) {
					if ( origin.hasOwnProperty( s.name ) ) {
						chains[ mod.id + '@' + s.name ] = origin[ s.name ];
					}
				});
			});
		});

		return chains;
	}
	var resolveChains__default = resolveChains__resolveChains;

	function getUniqueNames__getUniqueNames ( modules, userNames ) {
		var names = {}, used = {};

		// copy user-specified names
		if ( userNames ) {
			Object.keys( userNames ).forEach( function(n ) {
				names[n] = userNames[n];
				used[ userNames[n] ] = true;
			});
		}

		// infer names from imports
		modules.forEach( function(mod ) {
			mod.imports.forEach( function(x ) {
				var id = resolve__default( x.path, mod.file );
				x.id = id;

				if ( x.default && !names.hasOwnProperty( id ) && !used.hasOwnProperty( x.name ) ) {
					names[ id ] = x.name;
					used[ x.name ] = true;
				}
			});
		});

		// for the rest, make names as compact as possible without
		// introducing conflicts
		modules.forEach( function(mod ) {
			var parts, i, name;

			// is this already named?
			if ( names.hasOwnProperty( mod.id ) ) {
				return;
			}

			parts = mod.id.split( '/' );

			i = parts.length;
			while ( i-- ) {
				name = sanitize__default( parts.slice( i ).join( '_' ) );

				if ( !used.hasOwnProperty( name ) ) {
					break;
				}
			}

			while ( used.hasOwnProperty( name ) ) {
				name = '_' + name;
			}

			used[ name ] = true;
			names[ mod.id ] = name;
		});

		return names;
	}
	var getUniqueNames__default = getUniqueNames__getUniqueNames;

	function resolveExports__resolveExports ( bundle ) {
		var bundleExports = {};

		bundle.entryModule.exports.forEach( function(x ) {
			var name;

			if ( x.specifiers ) {
				x.specifiers.forEach( function(s ) {
					var hash = bundle.entryModule.id + '@' + s.name,
						split,
						moduleId,
						name;

					while ( bundle.chains[ hash ] ) {
						hash = bundle.chains[ hash ];
					}

					split = hash.split( '@' );
					moduleId = split[0];
					name = split[1];

					addExport( moduleId, name, s.name );

					// if ( !bundleExports[ moduleId ] ) {
					// 	bundleExports[ moduleId ] = {};
					// }

					// bundleExports[ moduleId ][ name ] = s.name;
				});
			}

			else if ( !x.default && ( name = x.name ) ) {
				addExport( bundle.entry, name, name );
			}
		});

		function addExport ( moduleId, name, as ) {
			if ( !bundleExports[ moduleId ] ) {
				bundleExports[ moduleId ] = {};
			}

			bundleExports[ moduleId ][ name ] = as;
		}

		return bundleExports;
	}
	var resolveExports__default = resolveExports__resolveExports;

	function extend__extend ( target ) {var SLICE$0 = Array.prototype.slice;var sources = SLICE$0.call(arguments, 1);
		sources.forEach( function(source ) {
			Object.keys( source ).forEach( function(key ) {
				target[ key ] = source[ key ];
			});
		});

		return target;
	}
	var extend__default = extend__extend;

	function disallowIllegalReassignment__disallowIllegalReassignment ( node, readOnlyNames, scope ) {
		var assignee, name, message;

		if ( node.type === 'AssignmentExpression' ) {
			assignee = node.left;
		} else if ( node.type === 'UpdateExpression' ) {
			assignee = node.argument;
		} else {
			return; // not an assignment
		}

		if ( assignee.type === 'MemberExpression' ) {
			assignee = assignee.object;
			message = 'Cannot reassign imported binding of namespace ';
		} else {
			message = 'Cannot reassign imported binding ';
		}

		if ( assignee.type !== 'Identifier' ) {
			return; // not assigning to a binding
		}

		name = assignee.name;

		if ( readOnlyNames.hasOwnProperty( name ) && !scope.contains( name ) ) {
			throw new Error( message + '`' + name + '`' );
		}
	}
	var disallowIllegalReassignment__default = disallowIllegalReassignment__disallowIllegalReassignment;

	function replaceIdentifiers__rewriteIdentifiers ( body, node, toRewrite, scope ) {
		var name, replacement;

		if ( node.type === 'Identifier' ) {
			name = node.name;
			replacement = toRewrite.hasOwnProperty( name ) && toRewrite[ name ];

			if ( replacement && !scope.contains( name, true ) ) {
				// rewrite
				body.replace( node.start, node.end, replacement );
			}
		}
	}
	var replaceIdentifiers__default = replaceIdentifiers__rewriteIdentifiers;

	function rewriteExportAssignments__rewriteExportAssignments ( body, node, exports, scope, toRewrite, alreadyExported, isTopLevelNode, capturedUpdates ) {
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
		if ( exports && ( exportAs = exports[ name ] ) ) {
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
	var rewriteExportAssignments__default = rewriteExportAssignments__rewriteExportAssignments;

	function traverseAst__traverseAst ( ast, body, identifierReplacements, readOnlyNames, exportNames, alreadyExported, indentExclusionRanges ) {
		var scope, blockScope, capturedUpdates;

		scope = ast._scope;
		blockScope = ast._blockScope;

		capturedUpdates = null;

		// scope is now the global scope
		estraverse__default.traverse( ast, {
			enter: function ( node, parent ) {
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
					var previous = capturedUpdates;
					capturedUpdates = [];
					capturedUpdates.previous = previous;
				}

				// Catch illegal reassignments
				disallowIllegalReassignment__default( node, readOnlyNames, scope );

				// Rewrite assignments to exports
				rewriteExportAssignments__default( body, node, exportNames, scope, identifierReplacements, alreadyExported, ~ast.body.indexOf( parent ), capturedUpdates );

				// Replace identifiers
				replaceIdentifiers__default( body, node, identifierReplacements, scope );

				// Add multi-line strings to exclusion ranges
				if ( node.type === 'TemplateLiteral' ) {
					indentExclusionRanges.push([ node.start, node.end ]);
				}
			},

			leave: function ( node ) {
				// Special case - see above
				if ( node.type === 'VariableDeclaration' ) {
					if ( capturedUpdates.length ) {
						body.replace( node.end, node.end, capturedUpdates.map( function(c ) {return ((" exports." + (c.name)) + (" = " + (c.exportAs)) + ";")} ).join( '' ) );
					}

					capturedUpdates = capturedUpdates.previous;
				}

				if ( node._scope ) {
					scope = scope.parent;
				} else if ( node._blockScope ) {
					blockScope = blockScope.parent;
				}
			}
		});
	}
	var traverseAst__default = traverseAst__traverseAst;

	function gatherImports__gatherImports ( imports, externalModuleLookup, chains, uniqueNames ) {
		var importIdentifierReplacements = {};

		imports.forEach( function(x ) {
			var external;

			if ( x.passthrough ) {
				return;
			}

			if ( externalModuleLookup.hasOwnProperty( x.path ) ) {
				external = true;
			}

			x.specifiers.forEach( function(s ) {
				var moduleId, moduleName, specifierName, name, replacement, hash, isChained, separatorIndex;

				moduleId = x.id;

				if ( s.batch ) {
					name = s.name;
					replacement = uniqueNames[ moduleId ];
				} else {
					name = s.as;
					specifierName = s.name;

					// If this is a chained import, get the origin
					hash = moduleId + '@' + specifierName;
					while ( chains.hasOwnProperty( hash ) ) {
						hash = chains[ hash ];
						isChained = true;
					}

					if ( isChained ) {
						separatorIndex = hash.indexOf( '@' );
						moduleId = hash.substr( 0, separatorIndex );
						specifierName = hash.substring( separatorIndex + 1 );
					}

					moduleName = uniqueNames[ moduleId ];

					if ( !external || specifierName === 'default' ) {
						replacement = moduleName + '__' + specifierName;
					} else {
						replacement = moduleName + '.' + specifierName;
					}
				}

				importIdentifierReplacements[ name ] = replacement;
			});
		});

		return importIdentifierReplacements;
	}
	var gatherImports__default = gatherImports__gatherImports;

	function transformBody__transformBody ( bundle, mod, body, prefix ) {
		var identifierReplacements = {},
			importIdentifierReplacements,
			exportNames,
			alreadyExported = {},
			shouldExportEarly = {},
			exportBlock,
			defaultValue,
			indentExclusionRanges = [];

		// All variables declared at the top level are given a prefix,
		// as an easy way to deconflict when two or more modules have the
		// same variable names. TODO deconflict more elegantly (see e.g.
		// https://github.com/Rich-Harris/esperanto/pull/24)
		mod.ast._scope.names.forEach( function(n ) {return identifierReplacements[n] = prefix + '__' + n} );
		mod.ast._blockScope.names.forEach( function(n ) {return identifierReplacements[n] = prefix + '__' + n} );

		importIdentifierReplacements = gatherImports__default( mod.imports, bundle.externalModuleLookup, bundle.chains, bundle.uniqueNames );
		extend__default( identifierReplacements, importIdentifierReplacements );

		exportNames = bundle.exports[ mod.id ];

		traverseAst__default( mod.ast, body, identifierReplacements, importIdentifierReplacements, exportNames, alreadyExported, indentExclusionRanges );

		// remove imports
		mod.imports.forEach( function(x ) {
			if ( !x.passthrough ) {
				body.remove( x.start, x.next );
			}
		});

		// Remove export statements (but keep declarations)
		mod.exports.forEach( function(x ) {
			var name;

			if ( x.default ) {
				if ( x.type === 'namedFunction' || x.type === 'namedClass' ) {
					// if you have a default export like
					//
					//     export default function foo () {...}
					//
					// you need to rewrite it as
					//
					//     function foo () {...}
					//     exports.default = foo;
					//
					// as the `foo` reference may be used elsewhere

					// remove the `export default `, keep the rest
					body.remove( x.start, x.valueStart );

					// export the function for other modules to use (TODO this shouldn't be necessary)
					body.replace( x.end, x.end, (("\nvar " + prefix) + ("__default = " + prefix) + ("__" + (x.name)) + ";") );
				}

				else if ( x.node.declaration && ( name = x.node.declaration.name ) ) {
					defaultValue = prefix + '__' + name;
					body.replace( x.start, x.end, (("var " + prefix) + ("__default = " + defaultValue) + ";") );
				}

				else {
					body.replace( x.start, x.valueStart, (("var " + prefix) + "__default = ") );
				}

				return;
			}

			if ( x.declaration ) {
				if ( x.type === 'namedFunction' ) {
					shouldExportEarly[ x.name ] = true; // TODO what about `function foo () {}; export { foo }`?
				}

				body.remove( x.start, x.valueStart );
			} else {
				body.remove( x.start, x.next );
			}
		});

		if ( mod._exportsNamespace ) {
			var namespaceExportBlock = (("var " + prefix) + " = {\n"),
				namespaceExports = [];

			mod.exports.forEach( function(x ) {
				if ( x.declaration ) {
					namespaceExports.push( body.indentStr + (("get " + (x.name)) + (" () { return " + prefix) + ("__" + (x.name)) + "; }") );
				}

				else if ( x.default ) {
					namespaceExports.push( body.indentStr + (("get default () { return " + prefix) + "__default; }") );
				}

				else {
					x.specifiers.forEach( function(s ) {
						namespaceExports.push( body.indentStr + (("get " + (s.name)) + (" () { return " + (s.name)) + "; }") );
					});
				}
			});

			namespaceExportBlock += namespaceExports.join( ',\n' ) + '\n};\n\n';

			body.prepend( namespaceExportBlock );
		}

		if ( exportNames ) {
			exportBlock = [];

			Object.keys( exportNames ).forEach( function(name ) {
				var exportAs;

				if ( !alreadyExported[ name ] ) {
					exportAs = exportNames[ name ];
					exportBlock.push( (("exports." + exportAs) + (" = " + prefix) + ("__" + name) + ";") );
				}
			});

			if ( exportBlock.length ) {
				body.trim().append( '\n\n' + exportBlock.join( '\n' ) );
			}
		}

		body.trim().indent({ exclude: indentExclusionRanges });
	}
	var transformBody__default = transformBody__transformBody;

	function combine__combine ( bundle ) {
		var body;

		body = new MagicString__default.Bundle({
			separator: '\n\n'
		});

		bundle.exports = resolveExports__default( bundle );

		bundle.modules.forEach( function(mod ) {
			var modBody = mod.body.clone(),
				prefix = bundle.uniqueNames[ mod.id ];

			annotateAst__default( mod.ast );
			transformBody__default( bundle, mod, modBody, prefix );

			body.addSource({
				filename: path__default.resolve( bundle.base, mod.file ),
				content: modBody
			});
		});

		bundle.body = body;
	}
	var combine__default = combine__combine;

	function getModule__getModule ( mod ) {var $D$1;
		var imports, exports;

		mod.body = new MagicString__default( mod.source );

		try {
			mod.ast = acorn__default.parse( mod.source, {
				ecmaVersion: 6,
				locations: true
			});
		} catch ( err ) {
			// If there's a parse error, attach file info
			if ( err.loc ) {
				err.file = mod.path;
			}

			throw err;
		}

		imports = ($D$1 = findImportsAndExports__default( mod, mod.source, mod.ast ))[0], exports = $D$1[1], $D$1;

		mod.imports = imports;
		mod.exports = exports;

		return mod;
	;$D$1 = void 0}
	var getModule__default = getModule__getModule;

	var getBundle__Promise = sander__default.Promise;

	function getBundle__getBundle ( options ) {
		var entry = options.entry.replace( /\.js$/, '' ),
			modules = [],
			moduleLookup = {},
			promiseById = {},
			skip = options.skip,
			names = options.names,
			base = ( options.base ? path__default.resolve( options.base ) : process.cwd() ) + '/',
			externalModules = [],
			externalModuleLookup = {};

		if ( !entry.indexOf( base ) ) {
			entry = entry.substring( base.length );
		}

		return fetchModule( entry )
			.then( function()  {
				var entryModule, bundle;

				entryModule = moduleLookup[ entry ];
				modules = sortModules__default( entryModule, moduleLookup ); // TODO is this necessary? surely it's already sorted because of the fetch order? or do we need to prevent parallel reads?

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
					uniqueNames: getUniqueNames__default( modules, options.names ),
					chains: resolveChains__default( modules, moduleLookup )
				};

				combine__default( bundle );

				return bundle;
			});

		function fetchModule ( moduleId ) {
			var modulePath;

			modulePath = path__default.resolve( base, moduleId + '.js' );

			if ( !promiseById.hasOwnProperty( moduleId ) ) {
				promiseById[ moduleId ] = sander__default.readFile( modulePath ).catch( function ( err ) {
					if ( err.code === 'ENOENT' ) {
						modulePath = modulePath.replace( /\.js$/, '/index.js' );
						return sander__default.readFile( modulePath );
					}

					throw err;
				}).then( String ).then( function ( source ) {
					var module, promises;

					module = getModule__default({
						source: source,
						id: moduleId,
						file: modulePath.substring( base.length ),
						path: modulePath
					});

					modules.push( module );
					moduleLookup[ moduleId ] = module;

					promises = module.imports.map( function(x ) {
						var importId;

						importId = resolve__default( x.path, module.file );

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

					return getBundle__Promise.all( promises );
				}).catch( function ( err ) {
					var externalModule;

					if ( err.code === 'ENOENT' ) {
						if ( moduleId === entry ) {
							throw new Error( 'Could not find entry module (' + entry + ')' );
						}

						// Most likely an external module
						if ( !externalModuleLookup.hasOwnProperty( moduleId ) ) {
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
	var getBundle__default = getBundle__getBundle;

	function transformExportDeclaration__transformExportDeclaration ( declaration, body ) {
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
	var transformExportDeclaration__default = transformExportDeclaration__transformExportDeclaration;

	var packageResult__warned = {};

	function packageResult__packageResult ( body, options, methodName, isBundle ) {
		var code, map;

		code = body.toString();

		if ( !!options.sourceMap ) {
			if ( !options.sourceMapFile || ( !isBundle && !options.sourceMapSource )  ) {
				throw new Error( 'You must provide `sourceMapSource` and `sourceMapFile` options' );
			}

			map = body.generateMap({
				includeContent: true,
				hires: true,
				file: options.sourceMapFile,
				source: !isBundle ? packageResult__getRelativePath( options.sourceMapFile, options.sourceMapSource ) : null
			});

			if ( options.sourceMap === 'inline' ) {
				code += '\n//# sourceMa' + 'ppingURL=' + map.toUrl();
				map = null;
			} else {
				code += '\n//# sourceMa' + 'ppingURL=./' + options.sourceMapFile.split( '/' ).pop() + '.map';
			}
		} else {
			map = null;
		}

		return {
			code: code,
			map: map,
			toString: function () {
				if ( !packageResult__warned[ methodName ] ) {
					console.log( 'Warning: esperanto.' + methodName + '() returns an object with a \'code\' property. You should use this instead of using the returned value directly' );
					packageResult__warned[ methodName ] = true;
				}

				return code;
			}
		};
	}
	var packageResult__default = packageResult__packageResult;

	function packageResult__getRelativePath ( from, to ) {
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

			return fromParts.concat( toParts ).join( '/' );
		} else {
			toParts.unshift( '.' );
			return toParts.join( '/' );
		}
	}

	function reorderImports__reorderImports ( imports ) {
		var i;

		// ensure empty imports are at the end
		i = imports.length;
		while ( i-- ) {
			if ( !imports[i].specifiers.length ) {
				imports.splice( imports.length - 1, 0, imports.splice( i, 1 )[0] );
			}
		}
	}
	var reorderImports__default = reorderImports__reorderImports;

 /**
  * Creates a template function from a template string. The template
    may have `<%= someVar %>` interpolators, and the returned function
    should be called with a data object e.g. `{ someVar: 'someData' }`
  * @param {string} str - the template string
  * @returns {function}
  */
 function template__template ( str ) {
 	return function ( data ) {
 		return str.replace( /<%=\s*([^\s]+)\s*%>/g, function ( match, $1 ) {
 			return $1 in data ? data[ $1 ] : match;
 		});
 	};
 }
 var template__default = template__template;

	function mappers__getId ( m ) {
		return m.id;
	}

	function mappers__quote ( str ) {
		return "'" + str + "'";
	}

	function mappers__req ( path ) {
		return 'require(\'' + path + '\')';
	}

	function mappers__globalify ( name ) {
		return 'global.' + name;
	}

	var amd__introTemplate = template__default( 'define(<%= IMPORT_PATHS %>function (<%= IMPORT_NAMES %>) {\n\n' );

	function amd__amd ( mod, body, options ) {
		var importNames = [],
			importPaths = [],
			intro,
			i;

		// ensure empty imports are at the end
		reorderImports__default( mod.imports );

		// gather imports, and remove import declarations
		mod.imports.forEach( function( x, i )  {
			var specifier;

			importPaths[i] = x.path;

			specifier = x.specifiers[0];
			if ( specifier ) {
				importNames[i] = specifier.batch ? specifier.name : specifier.as;
			}

			body.remove( x.start, x.next );
		});

		transformExportDeclaration__default( mod.exports[0], body );

		body.trim();

		body.prepend( "'use strict';\n\n" ).trim();

		intro = amd__introTemplate({
			IMPORT_PATHS: importPaths.length ? '[' + importPaths.map( mappers__quote ).join( ', ' ) + '], ' : '',
			IMPORT_NAMES: importNames.join( ', ' )
		});

		body.indent().prepend( intro ).append( '\n\n});' );

		return packageResult__default( body, options, 'toAmd' );
	}
	var amd__default = amd__amd;

	function cjs__cjs ( mod, body, options ) {
		var replacement, exportDeclaration;

		mod.imports.forEach( function(x ) {
			var specifier, name;

			specifier = x.specifiers[0];

			if ( !specifier ) {
				// empty import
				replacement = (("require('" + (x.path)) + "');");
			} else {
				name = specifier.batch ? specifier.name : specifier.as;
				replacement = (("var " + name) + (" = require('" + (x.path)) + "');");
			}

			body.replace( x.start, x.end, replacement );
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

		body.trim();

		body.prepend( "'use strict';\n\n" ).indent().prepend( '(function () {\n\n' ).append( '\n\n}).call(global);' );

		return packageResult__default( body, options, 'toCjs' );
	}
	var cjs__default = cjs__cjs;

	var umd__introTemplate;

	function umd__umd ( mod, body, options ) {
		var importNames = [],
			importPaths = [],
			intro,
			i;

		if ( !options.name ) {
			throw new Error( 'You must supply a `name` option for UMD modules' );
		}

		// ensure empty imports are at the end
		reorderImports__default( mod.imports );

		// gather imports, and remove import declarations
		mod.imports.forEach( function( x, i )  {
			var specifier;

			importPaths[i] = x.path;

			specifier = x.specifiers[0];
			if ( specifier ) {
				importNames[i] = specifier.batch ? specifier.name : specifier.as;
			}

			body.remove( x.start, x.next );
		});

		transformExportDeclaration__default( mod.exports[0], body );

		body.trim();

		body.prepend( "'use strict';\n\n" ).trim();

		intro = umd__introTemplate({
			AMD_DEPS: importPaths.length ? '[' + importPaths.map( mappers__quote ).join( ', ' ) + '], ' : '',
			CJS_DEPS: importPaths.map( mappers__req ).join( ', ' ),
			GLOBAL_DEPS: importNames.map( mappers__globalify ).join( ', ' ),
			IMPORT_NAMES: importNames.join( ', ' ),
			NAME: options.name
		}).replace( /\t/g, body.indentStr );

		body.indent().prepend( intro ).append( '\n\n}));' );

		return packageResult__default( body, options, 'toUmd' );
	}
	var umd__default = umd__umd;

	umd__introTemplate = template__default( ("(function (global, factory) {\
\n\
\n	'use strict';\
\n\
\n	if (typeof define === 'function' && define.amd) {\
\n		// export as AMD\
\n		define(<%= AMD_DEPS %>factory);\
\n	} else if (typeof module !== 'undefined' && module.exports && typeof require === 'function') {\
\n		// node/browserify\
\n		module.exports = factory(<%= CJS_DEPS %>);\
\n	} else {\
\n		// browser global\
\n		global.<%= NAME %> = factory(<%= GLOBAL_DEPS %>);\
\n	}\
\n\
\n}(typeof window !== 'undefined' ? window : this, function (<%= IMPORT_NAMES %>) {\
\n\
\n") );

	var defaultsMode__default = {
		amd: amd__default,
		cjs: cjs__default,
		umd: umd__default
	};

	function utils_gatherImports__gatherImports ( imports, getName ) {
		var importedBindings = {}, identifierReplacements = {};

		imports.forEach( function(x ) {
			x.specifiers.forEach( function(s ) {
				var name, replacement;

				if ( s.batch ) {
					name = s.name;
				} else {
					name = s.as;
				}

				if ( s.batch ) {
					replacement = s.name;
				} else {
					if ( s.default ) {
						replacement = getName( x ) + '[\'default\']';
					} else {
						replacement = getName( x ) + '.' + s.name;
					}
				}

				importedBindings[ name ] = replacement;

				if ( !x.passthrough ) {
					identifierReplacements[ name ] = replacement;
				}
			});
		});

		return [ importedBindings, identifierReplacements ];
	}
	var utils_gatherImports__default = utils_gatherImports__gatherImports;

	function getExportNames__getExportNames ( exports ) {
		var result = {};

		exports.forEach( function(x ) {
			if ( x.default ) return;

			if ( x.declaration ) {
				result[ x.name ] = x.name;
				return;
			}

			x.specifiers.forEach( function(s ) {
				result[ s.name ] = s.name;
			});
		});

		return result;
	}
	var getExportNames__default = getExportNames__getExportNames;

	function utils_transformBody__transformBody ( mod, body, options ) {var $D$2;
		var importedBindings,
			identifierReplacements,
			exportNames = [],
			alreadyExported = {},
			shouldExportEarly = {},
			earlyExports,
			lateExports,
			defaultValue,
			indentExclusionRanges = [];

		importedBindings = ($D$2 = utils_gatherImports__default( mod.imports, mod.getName ))[0], identifierReplacements = $D$2[1], $D$2;
		exportNames = getExportNames__default( mod.exports );

		traverseAst__default( mod.ast, body, identifierReplacements, identifierReplacements, exportNames, alreadyExported, indentExclusionRanges );

		// Remove import statements
		mod.imports.forEach( function(x ) {
			if ( x.passthrough ) return; // this is an `export { foo } from './bar'` statement
			body.remove( x.start, x.next );
		});

		// Remove export statements (but keep declarations)
		mod.exports.forEach( function(x ) {
			switch ( x.type ) {
				case 'varDeclaration': // export var answer = 42;
					body.remove( x.start, x.valueStart );
					return;

				case 'namedFunction':
				case 'namedClass':
					if ( x.default ) {
						// export default function answer () { return 42; }
						defaultValue = body.slice( x.valueStart, x.end );
						body.replace( x.start, x.end, defaultValue + '\nexports[\'default\'] = ' + x.name + ';' );
					} else {
						// export function answer () { return 42; }
						shouldExportEarly[ x.name ] = true; // TODO what about `function foo () {}; export { foo }`?
						body.remove( x.start, x.valueStart );
					}
					return;

				case 'anonFunction':
				case 'anonClass':
					// export default function () {}
					body.replace( x.start, x.valueStart, 'exports[\'default\'] = ' );
					return;

				case 'expression':
					// export default 40 + 2;
					body.replace( x.start, x.valueStart, 'exports[\'default\'] = ' );
					return;

				case 'named':
					// export { foo, bar };
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
			var exportAs, chain;

			exportAs = exportNames[ name ];

			if ( chain = importedBindings[ name ] ) {
				// special case - a binding from another module
				earlyExports.push( (("Object.defineProperty(exports, '" + exportAs) + ("', { get: function () { return " + chain) + "; }});") );
			} else if ( shouldExportEarly[ name ] ) {
				earlyExports.push( (("exports." + exportAs) + (" = " + name) + ";") );
			} else if ( !alreadyExported[ name ] ) {
				lateExports.push( (("exports." + exportAs) + (" = " + name) + ";") );
			}
		});

		if ( lateExports.length ) {
			body.trim().append( '\n\n' + lateExports.join( '\n' ) );
		}

		// Prepend require() statements
		if ( options.header ) {
			body.prepend( options.header + '\n\n' );
		}

		// Function exports should be exported immediately after 'use strict'
		if ( earlyExports.length ) {
			body.trim().prepend( earlyExports.join( '\n' ) + '\n\n' );
		}

		body.trim().indent({
			exclude: indentExclusionRanges.length ? indentExclusionRanges : null
		}).prepend( options.intro ).trim().append( options.outro );
	;$D$2 = void 0}
	var utils_transformBody__default = utils_transformBody__transformBody;

	function getImportSummary__getImportSummary ( mod ) {
		var importPaths = [], importNames = [];

		mod.imports.forEach( function( x, i )  {
			importPaths[i] = x.path;

			if ( x.specifiers.length ) { // don't add empty imports
				importNames[i] = mod.getName( x );
			}
		});

		return [ importPaths, importNames ];
	}
	var getImportSummary__default = getImportSummary__getImportSummary;

	var strictMode_amd__introTemplate;

	strictMode_amd__introTemplate = template__default( 'define(<%= paths %>function (<%= names %>) {\n\n\t\'use strict\';\n\n' );

	function strictMode_amd__amd ( mod, body, options ) {var $D$3;
		var importPaths,
			importNames,
			intro;

		// ensure empty imports are at the end
		reorderImports__default( mod.imports );

		importPaths = ($D$3 = getImportSummary__default( mod ))[0], importNames = $D$3[1], $D$3;

		if ( mod.exports.length ) {
			importPaths.unshift( 'exports' );
			importNames.unshift( 'exports' );
		}

		intro = strictMode_amd__introTemplate({
			paths: importPaths.length ? '[' + importPaths.map( mappers__quote ).join( ', ' ) + '], ' : '',
			names: importNames.join( ', ' )
		}).replace( /\t/g, body.indentStr );

		utils_transformBody__default( mod, body, {
			intro: intro,
			outro: '\n\n});'
		});

		return packageResult__default( body, options, 'toAmd' );
	;$D$3 = void 0}
	var strictMode_amd__default = strictMode_amd__amd;

	var strictMode_cjs__intro = '(function () {\n\n\t\'use strict\';\n\n';
	var strictMode_cjs__outro = '\n\n}).call(global);';

	function strictMode_cjs__cjs ( mod, body, options ) {
		var importBlock;

		// Create block of require statements
		importBlock = mod.imports.map( function(x ) {
			var specifier, name, replacement;

			specifier = x.specifiers[0];

			if ( !specifier ) {
				// empty import
				replacement = (("require('" + (x.path)) + "');");
			} else {
				name = specifier.batch ? specifier.name : mod.getName( x );
				replacement = (("var " + name) + (" = require('" + (x.path)) + "');");
			}

			return replacement;
		}).join( '\n' );

		utils_transformBody__default( mod, body, {
			intro: strictMode_cjs__intro.replace( /\t/g, body.indentStr ),
			header: importBlock,
			outro: strictMode_cjs__outro
		});

		return packageResult__default( body, options, 'toCjs' );
	}
	var strictMode_cjs__default = strictMode_cjs__cjs;

	var strictMode_umd__introTemplate;

	function strictMode_umd__umd ( mod, body, options ) {var $D$4;
		var importPaths,
			importNames,
			intro;

		if ( !options.name ) {
			throw new Error( 'You must supply a `name` option for UMD modules' );
		}

		reorderImports__default( mod.imports );

		importPaths = ($D$4 = getImportSummary__default( mod ))[0], importNames = $D$4[1], $D$4;

		intro = strictMode_umd__introTemplate({
			amdDeps: [ 'exports' ].concat( importPaths ).map( mappers__quote ).join( ', ' ),
			cjsDeps: [ 'exports' ].concat( importPaths.map( mappers__req ) ).join( ', ' ),
			globals: [ ("global." + (options.name)) ].concat( importNames.map( mappers__globalify ) ).join( ', ' ),
			names: [ 'exports' ].concat( importNames ).join( ', ' ),
			name: options.name
		}).replace( /\t/g, body.indentStr );

		utils_transformBody__default( mod, body, {
			intro: intro,
			outro: '\n\n}));'
		});

		return packageResult__default( body, options, 'toUmd' );
	;$D$4 = void 0}
	var strictMode_umd__default = strictMode_umd__umd;

	strictMode_umd__introTemplate = template__default( ("(function (global, factory) {\
\n\
\n	'use strict';\
\n\
\n	if (typeof define === 'function' && define.amd) {\
\n		// export as AMD\
\n		define([<%= amdDeps %>], factory);\
\n	} else if (typeof module !== 'undefined' && module.exports && typeof require === 'function') {\
\n		// node/browserify\
\n		factory(<%= cjsDeps %>);\
\n	} else {\
\n		// browser global\
\n		global.<%= name %> = {};\
\n		factory(<%= globals %>);\
\n	}\
\n\
\n}(typeof window !== 'undefined' ? window : this, function (<%= names %>) {\
\n\
\n	'use strict';\
\n\
\n") );

	var strictMode__default = {
		amd: strictMode_amd__default,
		cjs: strictMode_cjs__default,
		umd: strictMode_umd__default
	};

	// TODO rewrite with named imports/exports
	var moduleBuilders__default = {
		defaultsMode: defaultsMode__default,
		strictMode: strictMode__default
	};

	var defaultsMode_amd__introTemplate = template__default( 'define(<%= amdDeps %>function (<%= names %>) {\n\n\t\'use strict\';\n\n' );

	function defaultsMode_amd__amd ( bundle, body, options ) {
		var entry = bundle.entryModule,
			x,
			exportStatement,
			intro,
			indentStr;

		indentStr = body.getIndentString();

		if ( x = entry.exports[0] ) {
			exportStatement = indentStr + 'return ' + bundle.uniqueNames[ bundle.entry ] + '__default;';
			body.append( '\n\n' + exportStatement );
		}

		intro = defaultsMode_amd__introTemplate({
			amdDeps: bundle.externalModules.length ? '[' + bundle.externalModules.map( defaultsMode_amd__quoteId ).join( ', ' ) + '], ' : '',
			names: bundle.externalModules.map( function(m ) {return bundle.uniqueNames[ m.id ]} ).join( ', ' )
		}).replace( /\t/g, indentStr );

		body.prepend( intro ).trim().append( '\n\n});' );
		return packageResult__default( body, options, 'toAmd', true );
	}
	var defaultsMode_amd__default = defaultsMode_amd__amd;

	function defaultsMode_amd__quoteId ( m ) {
		return "'" + m.id + "'";
	}

	function defaultsMode_cjs__cjs ( bundle, body, options ) {
		var importBlock,
			entry = bundle.entryModule,
			x,
			exportStatement,
			intro,
			indentStr;

		indentStr = body.getIndentString();

		importBlock = bundle.externalModules.map( function(x ) {
			var name = bundle.uniqueNames[ x.id ];
			return indentStr + (("var " + name) + ("__default = require('" + (x.id)) + "');");
		}).join( '\n' );

		if ( importBlock ) {
			body.prepend( importBlock + '\n\n' );
		}

		if ( x = entry.exports[0] ) {
			exportStatement = indentStr + 'module.exports = ' + bundle.uniqueNames[ bundle.entry ] + '__default;';
			body.append( '\n\n' + exportStatement );
		}

		intro = '(function () {\n\n' + indentStr + "'use strict';\n\n";

		body.prepend( intro ).trim().append( '\n\n}).call(global);' );
		return packageResult__default( body, options, 'toCjs', true );
	}
	var defaultsMode_cjs__default = defaultsMode_cjs__cjs;

	var defaultsMode_umd__introTemplate;

	function defaultsMode_umd__umd ( bundle, body, options ) {
		var x,
			entry = bundle.entryModule,
			exportStatement,
			amdDeps,
			cjsDeps,
			globals,
			intro,
			indentStr;

		indentStr = body.getIndentString();

		if ( !options || !options.name ) {
			throw new Error( 'You must specify an export name, e.g. `bundle.toUmd({ name: "myModule" })`' );
		}

		if ( x = entry.exports[0] ) {
			exportStatement = indentStr + 'return ' + bundle.uniqueNames[ bundle.entry ] + '__default;';
			body.append( '\n\n' + exportStatement );
		}

		amdDeps = bundle.externalModules.map( defaultsMode_umd__quoteId ).join( ', ' );
		cjsDeps = bundle.externalModules.map( defaultsMode_umd__req ).join( ', ' );
		globals = bundle.externalModules.map( function(m ) {return 'global.' + bundle.uniqueNames[ m.id ]} ).join( ', ' );

		intro = defaultsMode_umd__introTemplate({
			amdDeps: amdDeps,
			cjsDeps: cjsDeps,
			globals: globals,
			name: options.name,
			names: bundle.externalModules.map( function(m ) {return bundle.uniqueNames[ m.id ] + '__default'} ).join( ', ' )
		}).replace( /\t/g, indentStr );

		body.prepend( intro ).trim().append( '\n\n}));' );
		return packageResult__default( body, options, 'toUmd', true );
	}
	var defaultsMode_umd__default = defaultsMode_umd__umd;

	function defaultsMode_umd__quoteId ( m ) {
		return "'" + m.id + "'";
	}

	function defaultsMode_umd__req ( m ) {
		return 'require(\'' + m.id + '\')';
	}

	defaultsMode_umd__introTemplate = template__default( ("(function (global, factory) {\
\n\
\n	'use strict';\
\n\
\n	if (typeof define === 'function' && define.amd) {\
\n		// export as AMD\
\n		define([<%= amdDeps %>], factory);\
\n	} else if (typeof module !== 'undefined' && module.exports && typeof require === 'function') {\
\n		// node/browserify\
\n		module.exports = factory(<%= cjsDeps %>);\
\n	} else {\
\n		// browser global\
\n		global.<%= name %> = factory(<%= globals %>);\
\n	}\
\n\
\n}(typeof window !== 'undefined' ? window : this, function (<%= names %>) {\
\n\
\n	'use strict';\
\n\
\n") );

	var builders_defaultsMode__default = {
		amd: defaultsMode_amd__default,
		cjs: defaultsMode_cjs__default,
		umd: defaultsMode_umd__default
	};

	function getExportBlock__getExportBlock ( bundle, entry, indentStr ) {
		var exportBlock = '', name;

		name = bundle.uniqueNames[ bundle.entry ];

		// create an export block
		if ( entry.defaultExport ) {
			exportBlock = indentStr + 'exports[\'default\'] = ' + name + '__default;';
		}

		return exportBlock;
	}
	var getExportBlock__default = getExportBlock__getExportBlock;

	var builders_strictMode_amd__introTemplate;

	function builders_strictMode_amd__amd ( bundle, body, options ) {
		var defaultsBlock,
			entry = bundle.entryModule,
			importIds = bundle.externalModules.map( mappers__getId ),
			importNames = importIds.map( function(id ) {return bundle.uniqueNames[ id ]} ),
			intro,
			indentStr;

		indentStr = body.getIndentString();

		if ( importNames.length ) {
			defaultsBlock = importNames.map( function(name ) {
				return indentStr + (("var " + name) + ("__default = ('default' in " + name) + (" ? " + name) + ("['default'] : " + name) + ");");
			}).join( '\n' );

			body.prepend( defaultsBlock + '\n\n' );
		}

		if ( entry.exports.length ) {
			importIds.unshift( 'exports' );
			importNames.unshift( 'exports' );

			if ( entry.defaultExport ) {
				body.append( '\n\n' + getExportBlock__default( bundle, entry, indentStr ) );
			}
		}

		intro = builders_strictMode_amd__introTemplate({
			amdDeps: importIds.length ? '[' + importIds.map( mappers__quote ).join( ', ' ) + '], ' : '',
			names: importNames.join( ', ' )
		}).replace( /\t/g, indentStr );

		body.prepend( intro ).trim().append( '\n\n});' );
		return packageResult__default( body, options, 'toAmd', true );
	}
	var builders_strictMode_amd__default = builders_strictMode_amd__amd;

	builders_strictMode_amd__introTemplate = template__default( 'define(<%= amdDeps %>function (<%= names %>) {\n\n\t\'use strict\';\n\n' );

	function builders_strictMode_cjs__cjs ( bundle, body, options ) {
		var importBlock,
			entry = bundle.entryModule,
			intro,
			indentStr;

		indentStr = body.getIndentString();

		importBlock = bundle.externalModules.map( function(x ) {
			var name = bundle.uniqueNames[ x.id ];

			return indentStr + (("var " + name) + (" = require('" + (x.id)) + "');\n") +
			       indentStr + (("var " + name) + ("__default = ('default' in " + name) + (" ? " + name) + ("['default'] : " + name) + ");");
		}).join( '\n' );

		if ( importBlock ) {
			body.prepend( importBlock + '\n\n' );
		}

		if ( entry.defaultExport ) {
			body.append( '\n\n' + getExportBlock__default( bundle, entry, indentStr ) );
		}

		intro = '(function () {\n\n' + indentStr + "'use strict';\n\n";

		body.prepend( intro ).trim().append( '\n\n}).call(global);' );
		return packageResult__default( body, options, 'toCjs', true );
	}
	var builders_strictMode_cjs__default = builders_strictMode_cjs__cjs;

	var builders_strictMode_umd__introTemplate;

	function builders_strictMode_umd__umd ( bundle, body, options ) {
		var defaultsBlock,
			entry = bundle.entryModule,
			importPaths,
			importNames,
			amdDeps,
			cjsDeps,
			globals,
			names,
			intro,
			indentStr;

		indentStr = body.getIndentString();

		if ( !options || !options.name ) {
			throw new Error( 'You must specify an export name, e.g. `bundle.toUmd({ name: "myModule" })`' );
		}

		defaultsBlock = bundle.externalModules.map( function(x ) {
			var name = bundle.uniqueNames[ x.id ];
			return indentStr + (("var " + name) + ("__default = ('default' in " + name) + (" ? " + name) + ("['default'] : " + name) + ");");
		}).join( '\n' );

		if ( defaultsBlock ) {
			body.prepend( defaultsBlock + '\n\n' );
		}

		importPaths = bundle.externalModules.map( mappers__getId );
		importNames = bundle.externalModules.map( function(m ) {return bundle.uniqueNames[ m.id ]} );

		if ( entry.exports.length ) {
			amdDeps = [ 'exports' ].concat( importPaths ).map( mappers__quote ).join( ', ' );
			cjsDeps = [ 'exports' ].concat( importPaths.map( mappers__req ) ).join( ', ' );
			globals = [ options.name ].concat( importNames ).map( mappers__globalify ).join( ', ' );
			names   = [ 'exports' ].concat( importNames ).join( ', ' );

			if ( entry.defaultExport ) {
				body.append( '\n\n' + getExportBlock__default( bundle, entry, indentStr ) );
			}
		} else {
			amdDeps = importPaths.map( mappers__quote ).join( ', ' );
			cjsDeps = importPaths.map( mappers__req ).join( ', ' );
			globals = importNames.map( mappers__globalify ).join( ', ' );
			names   = importNames.join( ', ' );
		}

		intro = builders_strictMode_umd__introTemplate({
			amdDeps: amdDeps,
			cjsDeps: cjsDeps,
			globals: globals,
			names: names,
			name: options.name
		}).replace( /\t/g, indentStr );

		body.prepend( intro ).trim().append( '\n\n}));' );
		return packageResult__default( body, options, 'toUmd', true );
	}
	var builders_strictMode_umd__default = builders_strictMode_umd__umd;

	builders_strictMode_umd__introTemplate = template__default( ("(function (global, factory) {\
\n\
\n	'use strict';\
\n\
\n	if (typeof define === 'function' && define.amd) {\
\n		// export as AMD\
\n		define([<%= amdDeps %>], factory);\
\n	} else if (typeof module !== 'undefined' && module.exports && typeof require === 'function') {\
\n		// node/browserify\
\n		factory(<%= cjsDeps %>);\
\n	} else {\
\n		// browser global\
\n		global.<%= name %> = {};\
\n		factory(<%= globals %>);\
\n	}\
\n\
\n}(typeof window !== 'undefined' ? window : this, function (<%= names %>) {\
\n\
\n	'use strict';\
\n\
\n") );

	var builders_strictMode__default = {
		amd: builders_strictMode_amd__default,
		cjs: builders_strictMode_cjs__default,
		umd: builders_strictMode_umd__default
	};

	// TODO rewrite with named imports/exports
	var bundleBuilders__default = {
		defaultsMode: builders_defaultsMode__default,
		strictMode: builders_strictMode__default
	};

	function hasNamedImports__hasNamedImports ( mod ) {
		var i, x;

		i = mod.imports.length;
		while ( i-- ) {
			x = mod.imports[i];

			if ( !x.specifiers.length ) {
				continue; // ok
			}

			if ( x.specifiers.length > 1 ) {
				return true;
			}

			if ( !x.specifiers[0].default && !x.specifiers[0].batch ) {
				return true;
			}
		}
	}
	var hasNamedImports__default = hasNamedImports__hasNamedImports;

	function hasNamedExports__hasNamedExports ( mod ) {
		var i;

		i = mod.exports.length;
		while ( i-- ) {
			if ( !mod.exports[i].default ) {
				return true;
			}
		}
	}
	var hasNamedExports__default = hasNamedExports__hasNamedExports;

	var esperanto__deprecateMessage = 'options.defaultOnly has been deprecated, and is now standard behaviour. To use named imports/exports, pass `strict: true`.',
		esperanto__alreadyWarned = false;

	function esperanto__transpileMethod ( format ) {
		return function ( source ) {var options = arguments[1];if(options === void 0)options = {};
			var mod,
				body,
				builder;

			mod = getStandaloneModule__default({ source: source, getModuleName: options.getModuleName, strict: options.strict });
			body = mod.body.clone();

			if ( 'defaultOnly' in options && !esperanto__alreadyWarned ) {
				// TODO link to a wiki page explaining this, or something
				console.log( esperanto__deprecateMessage );
				esperanto__alreadyWarned = true;
			}

			if ( !options.strict ) {
				// ensure there are no named imports/exports. TODO link to a wiki page...
				if ( hasNamedImports__default( mod ) || hasNamedExports__default( mod ) ) {
					throw new Error( 'You must be in strict mode (pass `strict: true`) to use named imports or exports' );
				}

				builder = moduleBuilders__default.defaultsMode[ format ];
			} else {
				builder = moduleBuilders__default.strictMode[ format ];
			}

			return builder( mod, body, options );
		};
	}

	var esperanto__default = {
		toAmd: esperanto__transpileMethod( 'amd' ),
		toCjs: esperanto__transpileMethod( 'cjs' ),
		toUmd: esperanto__transpileMethod( 'umd' ),

		bundle: function ( options ) {
			return getBundle__default( options ).then( function ( bundle ) {
				return {
					toAmd: function(options ) {return transpile( 'amd', options )},
					toCjs: function(options ) {return transpile( 'cjs', options )},
					toUmd: function(options ) {return transpile( 'umd', options )}
				};

				function transpile ( format, options ) {
					var builder;

					options = options || {};

					if ( 'defaultOnly' in options && !esperanto__alreadyWarned ) {
						// TODO link to a wiki page explaining this, or something
						console.log( esperanto__deprecateMessage );
						esperanto__alreadyWarned = true;
					}

					if ( !options.strict ) {
						// ensure there are no named imports/exports
						if ( hasNamedExports__default( bundle.entryModule ) ) {
							throw new Error( 'Entry module can only have named exports in strict mode (pass `strict: true`)' );
						}

						builder = bundleBuilders__default.defaultsMode[ format ];
					} else {
						builder = bundleBuilders__default.strictMode[ format ];
					}

					return builder( bundle, bundle.body.clone(), options );
				}
			});
		}
	};

 module.exports = esperanto__default;

}).call(global);
//# sourceMappingURL=./esperanto.js.map