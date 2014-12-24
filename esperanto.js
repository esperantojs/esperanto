(function () {

	'use strict';

	var acorn__default = require('acorn');
	var MagicString__default = require('magic-string');
	var path__default = require('path');
	var sander__default = require('sander');
	var estraverse__default = require('estraverse');

	var annotateAst__Scope = function ( options ) {
		options = options || {};

		this.parent = options.parent;
		this.names = options.params || [];
	};

	annotateAst__Scope.prototype = {
		add: function ( name ) {
			this.names.push( name );
		},

		contains: function ( name ) {
			if ( ~this.names.indexOf( name ) ) {
				return true;
			}

			if ( this.parent ) {
				return this.parent.contains( name );
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

	function findImportsAndExports__findImportsAndExports ( mod, source, ast, imports, exports ) {
		var previousDeclaration;

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
	}
	var findImportsAndExports__default = findImportsAndExports__findImportsAndExports;

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

	function getModuleNameHelper__moduleNameHelper ( userFn, varNames ) {
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
	var getModuleNameHelper__default = getModuleNameHelper__moduleNameHelper;

	function getStandaloneModule__getStandaloneModule ( options ) {
		var mod, varNames;

		mod = {
			source: options.source,
			body: new MagicString__default( options.source ),
			ast: acorn__default.parse( options.source, {
				ecmaVersion: 6,
				locations: true
			}),
			imports: [],
			exports: []
		};

		if ( options.strict ) {
			annotateAst__default( mod.ast );
			varNames = mod.ast._scope.names.concat( mod.ast._blockScope.names );
		}

		mod.getName = getModuleNameHelper__default( options.getModuleName, varNames );

		findImportsAndExports__default( mod, mod.source, mod.ast, mod.imports, mod.exports, options.getModuleName );

		return mod;
	}
	var getStandaloneModule__default = getStandaloneModule__getStandaloneModule;

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
			var origin = {}, namespaceExporter;

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

	function getUnscopedNames__getUnscopedNames ( mod ) {
		var unscoped = {};

		var importedNames;
		function imported ( name ) {
			if (!importedNames) {
				importedNames = {};
				mod.imports.forEach(function(i ) {
					!i.passthrough && i.specifiers.forEach(function(s ) {
						importedNames[ s.batch ? s.name : s.as ] = true;
					});
				});
			}
			return importedNames.hasOwnProperty( name );
		}

		var scope;

		estraverse__default.traverse( mod.ast, {
			enter: function ( node, parent ) {
				// we're only interested in references, not property names etc
				if ( node._skip ) return this.skip();

				if ( node._scope ) {
					scope = node._scope;
				}

				if ( node.type === 'Identifier' &&
						 !scope.contains( node.name ) &&
						 !imported( node.name ) ) {
					unscoped[ node.name ] = true;
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
	var getUnscopedNames__default = getUnscopedNames__getUnscopedNames;

	function topLevelScopeConflicts__topLevelScopeConflicts ( bundle ) {
		var conflicts = {};
		var inScope = {};

		bundle.modules.forEach( function(mod ) {
			var inModule = {};

			// bundle name is in top scope
			inModule[ bundle.uniqueNames[ mod.id ] ] = true;

			// all top defined identifiers are in top scope
			mod.ast._scope.names.forEach( function(name ) {
				inModule[ name ] = true;
			});

			// all unattributed identifiers could collide with top scope
			var unscoped = getUnscopedNames__default( mod );
			Object.keys( getUnscopedNames__default( mod ) ).forEach( function(name ) {
				inModule[ name ] = true;
			});

			// merge this module's top scope with bundle top scope
			Object.keys( inModule ).forEach( function(name ) {
				if ( inScope.hasOwnProperty( name ) ) {
					conflicts[ name ] = true;
				} else {
					inScope[ name ] = true;
				}
			});
		});

		return conflicts;
	}
	var topLevelScopeConflicts__default = topLevelScopeConflicts__topLevelScopeConflicts;

	function importsByModule__importsByModule ( bundle ) {
		var imports = {};

		bundle.modules.forEach( function(mod ) {
			mod.imports.forEach(function(i ) {
				i.specifiers.forEach(function(s ) {
					if ( !s.default ) {
						(imports[ i.id ] || (imports[ i.id ] = {}))[ s.name ] = true;
					}
				});
			});
		});

		return imports;
	}
	var importsByModule__default = importsByModule__importsByModule;

	function disallowIllegalReassignment__disallowIllegalReassignment ( node, names, scope ) {
		var assignee, name, replacement, message;

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
		replacement = names.hasOwnProperty( name ) && names[ name ];

		if ( !!replacement && !scope.contains( name ) ) {
			throw new Error( message + '`' + name + '`' );
		}
	}
	var disallowIllegalReassignment__default = disallowIllegalReassignment__disallowIllegalReassignment;

	function rewriteIdentifiers__rewriteIdentifiers ( body, node, toRewrite, scope, unscoped ) {
		var name, replacement;

		if ( node.type === 'Identifier' ) {
			name = node.name;
			replacement = toRewrite.hasOwnProperty( name ) && toRewrite[ name ];

			if ( replacement &&
					 !scope.contains( name ) &&
					 !(unscoped && unscoped.hasOwnProperty( name )) ) {
				// rewrite
				body.replace( node.start, node.end, replacement );
			}
		}
	}
	var rewriteIdentifiers__default = rewriteIdentifiers__rewriteIdentifiers;

	function gatherExports__gatherExports ( exports, toRewrite, prefix, conflicts ) {
		exports.forEach( function(x ) {
			if ( x.declaration ) {
				var name = x.name;
				if ( !toRewrite.hasOwnProperty( name ) ) {
					toRewrite[ name ] = conflicts.hasOwnProperty( name ) ?
						prefix + '__' + name :
						name;
				}
			} else if ( x.specifiers ) {
				x.specifiers.forEach( function(s ) {
					if ( !toRewrite.hasOwnProperty( s.name ) ) {
						toRewrite[ s.name ] = conflicts.hasOwnProperty( s.name ) ?
							prefix + '__' + s.name :
							s.name;
					}
				});
			}
		});
	}
	var gatherExports__default = gatherExports__gatherExports;

	function gatherImports__gatherImports ( imports, externalModuleLookup, importedBindings, toRewrite, chains, uniqueNames, conflicts ) {
		var replacements = {};

		imports.forEach( function(x ) {
			var external;

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

					if ( specifierName === 'default' ) {
						replacement = external || conflicts.hasOwnProperty( moduleName ) ?
							moduleName + '__default' :
							moduleName;
					} else if ( !external ) {
						replacement = conflicts.hasOwnProperty( specifierName ) ?
							moduleName + '__' + specifierName :
							specifierName;
					} else {
						replacement = moduleName + '.' + specifierName;
					}
				}

				importedBindings[ name ] = replacement;

				if ( !x.passthrough ) {
					toRewrite[ name ] = replacement;
				}
			});
		});

		return replacements;
	}
	var gatherImports__default = gatherImports__gatherImports;

	function transformBody__transformBody ( bundle, mod, body, prefix ) {
		var scope,
			scopeNames,
			blockScope,
			importedBindings = {},
			toRewrite = {},
			readOnly = {},
			exportNames = [],
			alreadyExported = {},
			shouldExportEarly = {},
			defaultValue,
			indentExclusionRanges = [];

		scope = mod.ast._scope;
		blockScope = mod.ast._blockScope;

		gatherImports__default(
			mod.imports,
			bundle.externalModuleLookup,
			importedBindings,
			toRewrite,
			bundle.chains,
			bundle.uniqueNames,
			bundle.conflicts
		);

		Object.keys( toRewrite ).forEach( function(k ) {return readOnly[k] = toRewrite[k]} );

		gatherExports__default( mod.exports, toRewrite, prefix, bundle.conflicts );
		//exportNames = getExportNames( mod.exports );

		scope.names.forEach( function(n ) {
			if ( !toRewrite.hasOwnProperty( n ) ) {
				var unconflicted = bundle.conflicts.hasOwnProperty( n ) ?
					prefix + '__' + n :
					n;
				toRewrite[ n ] =  transformBody__wasImported( bundle, mod, n ) ?
					'__' + unconflicted :
					unconflicted;
			}
		});

		var unscoped = getUnscopedNames__default( mod );

		// remove top-level names from scope. TODO is there a cleaner way to do this?
		scopeNames = scope.names;
		scope.names = [];

		estraverse__default.traverse( mod.ast, {
			enter: function ( node, parent ) {
				// we're only interested in references, not property names etc
				if ( node._skip ) return this.skip();

				if ( node._scope ) {
					scope = node._scope;
				} else if ( node._blockScope ) {
					blockScope = node._blockScope;
				}

				// Catch illegal reassignments
				disallowIllegalReassignment__default( node, readOnly, scope );

				// Rewrite assignments to exports
				transformBody__rewriteExportAssignments( body, node, exportNames, scope, alreadyExported, ~mod.ast.body.indexOf( parent ) );

				// Rewrite import and export identifiers
				rewriteIdentifiers__default( body, node, toRewrite, scope, unscoped );

				// Add multi-line strings to exclusion ranges
				if ( node.type === 'TemplateLiteral' ) {
					indentExclusionRanges.push([ node.start, node.end ]);
				}
			},

			leave: function ( node ) {
				if ( node.type === 'Program' ) {
					return;
				}

				if ( node._scope ) {
					scope = scope.parent;
				} else if ( node._blockScope ) {
					blockScope = blockScope.parent;
				}
			}
		});

		scope.names = scopeNames;

		// remove imports
		mod.imports.forEach( function(x ) {
			if ( !x.passthrough ) {
				body.remove( x.start, x.next );
			}
		});

		var defaultName = prefix;
		if ( bundle.conflicts.hasOwnProperty( prefix ) || mod._exportsNamespace ) {
			defaultName += '__default';
		}

		// Remove export statements (but keep declarations)
		mod.exports.forEach( function(x ) {
			var name;

			if ( x.default ) {
				if ( x.node.declaration && x.node.declaration.id && ( name = x.node.declaration.id.name ) ) {
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
					defaultValue = body.slice( x.valueStart, x.end ); // in case rewrites occured inside the function body
					body.remove( x.start, x.valueStart );

					body.replace( x.end, x.end, '\nvar ' + defaultName + ' = ' + toRewrite[ name ] + ';');
				} else {
					// TODO this is a bit convoluted...
					if ( x.node.declaration && ( name = x.node.declaration.name ) ) {
						defaultValue = toRewrite[ name ];
						body.replace( x.start, x.end, 'var ' + defaultName + ' = ' + defaultValue + ';');
					} else {
						body.replace( x.start, x.valueStart, 'var ' + defaultName + ' = ');
					}
				}

				return;
			}

			if ( x.declaration ) {
				if ( x.node.declaration.type === 'FunctionDeclaration' ) {
					shouldExportEarly[ x.node.declaration.id.name ] = true; // TODO what about `function foo () {}; export { foo }`?
				}

				body.remove( x.start, x.valueStart );
			} else {
				body.remove( x.start, x.next );
			}
		});

		if ( mod._exportsNamespace ) {
			var namespaceExportBlock = 'var ' + prefix + ' = {\n',
				namespaceExports = [];

			mod.exports.forEach( function(x ) {
				if ( x.declaration ) {
					namespaceExports.push( body.indentStr + 'get ' + x.name + ' () { return ' + toRewrite[ x.name ] + '; }' );
				}

				else if ( x.default ) {
					namespaceExports.push( body.indentStr + 'get default () { return ' + defaultName + '; }' );
				}

				else {
					x.specifiers.forEach( function(s ) {
						namespaceExports.push( body.indentStr + 'get ' + s.name + ' () { return ' + s.name + '; }' );
					});
				}
			});

			namespaceExportBlock += namespaceExports.join( ',\n' ) + '\n};\n\n';

			body.prepend( namespaceExportBlock );
		}

		body.trim().indent({ exclude: indentExclusionRanges });
	}
	var transformBody__default = transformBody__transformBody;

	function transformBody__rewriteExportAssignments ( body, node, exports, scope, alreadyExported, isTopLevelNode ) {
		var assignee, name;

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
		if ( ~exports.indexOf( name ) ) {
			// special case - increment/decrement operators
			if ( node.operator === '++' || node.operator === '--' ) {
				body.replace( node.end, node.end, ((", exports." + name) + (" = " + name) + "") );
			} else {
				body.replace( node.start, node.start, (("exports." + name) + " = ") );
			}

			// keep track of what we've already exported - we don't need to
			// export it again later
			if ( isTopLevelNode ) {
				alreadyExported[ name ] = true;
			}
		}
	}

	function transformBody__wasImported ( bundle, mod, name ) {
		return (
			bundle.importsByModule.hasOwnProperty( mod.id ) &&
			bundle.importsByModule[ mod.id ].hasOwnProperty( name )
		);
	}

	function combine__combine ( bundle ) {
		var body = new MagicString__default.Bundle({
			separator: '\n\n'
		});

		bundle.modules.forEach( function(mod ) {
			annotateAst__default( mod.ast );
		});

		var conflicts = topLevelScopeConflicts__default( bundle );
		bundle.conflicts = conflicts;

		var imports = importsByModule__default( bundle );
		bundle.importsByModule = imports;

		bundle.modules.forEach( function(mod ) {
			var modBody = mod.body.clone(),
				prefix = bundle.uniqueNames[ mod.id ];

			transformBody__default( bundle, mod, modBody, prefix, conflicts );

			body.addSource({
				filename: path__default.resolve( bundle.base, mod.file ),
				content: modBody
			});
		});

		bundle.body = body;
	}
	var combine__default = combine__combine;

	function getModule__getStandaloneModule ( mod ) {
		mod.body = new MagicString__default( mod.source );
		mod.imports = [];
		mod.exports = [];

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

		findImportsAndExports__default( mod, mod.source, mod.ast, mod.imports, mod.exports );

		return mod;
	}
	var getModule__default = getModule__getStandaloneModule;

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
					uniqueNames: getUniqueNames__default( modules, names ),
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

	var amd__template = 'define(__IMPORT_PATHS__function (__IMPORT_NAMES__) {\n\n';

	function amd__amd ( mod, body, options ) {
		var importNames = [],
			importPaths = [],
			intro,
			i;

		// ensure empty imports are at the end
		i = mod.imports.length;
		while ( i-- ) {
			if ( !mod.imports[i].specifiers.length ) {
				mod.imports.splice( mod.imports.length - 1, 0, mod.imports.splice( i, 1 )[0] );
			}
		}

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

		intro = amd__template
			.replace( '__IMPORT_PATHS__', importPaths.length ? '[' + importPaths.map( amd__quote ).join( ', ' ) + '], ' : '' )
			.replace( '__IMPORT_NAMES__', importNames.join( ', ' ) );

		body.indent().prepend( intro ).append( '\n\n});' );

		return packageResult__default( body, options, 'toAmd' );
	}
	var amd__default = amd__amd;

	function amd__quote ( str ) {
		return "'" + str + "'";
	}

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

	function template__template ( str ) {
		return function ( data ) {
			return str.replace( /<%=\s*([^\s]+)\s*%>/g, function ( match, $1 ) {
				return $1 in data ? data[ $1 ] : match;
			});
		};
	}
	var template__default = template__template;

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
		i = mod.imports.length;
		while ( i-- ) {
			if ( !mod.imports[i].specifiers.length ) {
				mod.imports.splice( mod.imports.length - 1, 0, mod.imports.splice( i, 1 )[0] );
			}
		}

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
			AMD_DEPS: importPaths.length ? '[' + importPaths.map( umd__quote ).join( ', ' ) + '], ' : '',
			CJS_DEPS: importPaths.map( umd__req ).join( ', ' ),
			GLOBAL_DEPS: importNames.map( umd__globalify ).join( ', ' ),
			IMPORT_NAMES: importNames.join( ', ' ),
			NAME: options.name
		}).replace( /\t/g, body.indentStr );

		body.indent().prepend( intro ).append( '\n\n}));' );

		return packageResult__default( body, options, 'toUmd' );
	}
	var umd__default = umd__umd;

	function umd__quote ( str ) {
		return "'" + str + "'";
	}

	function umd__req ( path ) {
		return (("require('" + path) + "')");
	}

	function umd__globalify ( name ) {
		return ("global." + name);
	}

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

	function utils_gatherImports__gatherImports ( imports, getName, importedBindings, toRewrite ) {
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
					toRewrite[ name ] = replacement;
				}
			});
		});
	}
	var utils_gatherImports__default = utils_gatherImports__gatherImports;

	function getExportNames__getExportNames ( exports ) {
		var result = [];

		exports.forEach( function(x ) {
			if ( x.default ) return;

			if ( x.declaration ) {
				result.push( x.name );
				return;
			}

			x.specifiers.forEach( function(s ) {
				result.push( s.name );
			});
		});

		return result;
	}
	var getExportNames__default = getExportNames__getExportNames;

	function utils_transformBody__transformBody ( mod, body, options ) {
		var scope,
			blockScope,
			importedBindings = {},
			toRewrite = {},
			exportNames = [],
			alreadyExported = {},
			shouldExportEarly = {},
			earlyExports,
			lateExports,
			defaultValue,
			capturedUpdates = null,
			indentExclusionRanges = [];

		scope = mod.ast._scope;
		blockScope = mod.ast._blockScope;

		utils_gatherImports__default( mod.imports, mod.getName, importedBindings, toRewrite );
		exportNames = getExportNames__default( mod.exports );

		// scope is now the global scope
		estraverse__default.traverse( mod.ast, {
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
				disallowIllegalReassignment__default( node, toRewrite, scope );

				// Rewrite assignments to exports
				utils_transformBody__rewriteExportAssignments( body, node, exportNames, scope, alreadyExported, ~mod.ast.body.indexOf( parent ), capturedUpdates );

				// Rewrite import identifiers
				rewriteIdentifiers__default( body, node, toRewrite, scope );

				// Add multi-line strings to exclusion ranges
				if ( node.type === 'TemplateLiteral' ) {
					indentExclusionRanges.push([ node.start, node.end ]);
				}
			},

			leave: function ( node ) {
				// Special case - see above
				if ( node.type === 'VariableDeclaration' ) {
					if ( capturedUpdates.length ) {
						body.replace( node.end, node.end, capturedUpdates.map( function(n ) {return ((" exports." + n) + (" = " + n) + ";")} ).join( '' ) );
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

		exportNames.forEach( function(name ) {
			var chain;

			if ( chain = importedBindings[ name ] ) {
				// special case - a binding from another module
				earlyExports.push( (("Object.defineProperty(exports, '" + name) + ("', { get: function () { return " + chain) + "; }});") );
			} else if ( shouldExportEarly[ name ] ) {
				earlyExports.push( (("exports." + name) + (" = " + name) + ";") );
			} else if ( !alreadyExported[ name ] ) {
				lateExports.push( (("exports." + name) + (" = " + name) + ";") );
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
	}
	var utils_transformBody__default = utils_transformBody__transformBody;

	function utils_transformBody__rewriteExportAssignments ( body, node, exports, scope, alreadyExported, isTopLevelNode, capturedUpdates ) {
		var assignee, name;

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
		if ( ~exports.indexOf( name ) ) {
			if ( !!capturedUpdates ) {
				capturedUpdates.push( name );
				return;
			}

			// special case - increment/decrement operators
			if ( node.operator === '++' || node.operator === '--' ) {
				body.replace( node.end, node.end, ((", exports." + name) + (" = " + name) + "") );
			} else {
				body.replace( node.start, node.start, (("exports." + name) + " = ") );
			}

			// keep track of what we've already exported - we don't need to
			// export it again later
			if ( isTopLevelNode ) {
				alreadyExported[ name ] = true;
			}
		}
	}

	var strictMode_amd__introTemplate;

	strictMode_amd__introTemplate = template__default( 'define(<%= paths %>function (<%= names %>) {\n\n\t\'use strict\';\n\n' );

	function strictMode_amd__amd ( mod, body, options ) {
		var importPaths = [],
			importNames = [],
			intro,
			i;

		// ensure empty imports are at the end
		reorderImports__default( mod.imports );

		// gather imports, and remove import declarations
		mod.imports.forEach( function( x, i )  {
			importPaths[i] = x.path;

			if ( x.specifiers.length ) { // don't add empty imports
				importNames[i] = mod.getName( x );
			}
		});

		if ( mod.exports.length ) {
			importPaths.unshift( 'exports' );
			importNames.unshift( 'exports' );
		}

		intro = strictMode_amd__introTemplate({
			paths: importPaths.length ? '[' + importPaths.map( strictMode_amd__quote ).join( ', ' ) + '], ' : '',
			names: importNames.join( ', ' )
		}).replace( /\t/g, body.indentStr );

		utils_transformBody__default( mod, body, {
			intro: intro,
			outro: '\n\n});'
		});

		return packageResult__default( body, options, 'toAmd' );
	}
	var strictMode_amd__default = strictMode_amd__amd;

	function strictMode_amd__quote ( str ) {
		return "'" + str + "'";
	}

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

	function strictMode_umd__umd ( mod, body, options ) {
		var importPaths = [],
			importNames = [],
			intro,
			i;

		if ( !options.name ) {
			throw new Error( 'You must supply a `name` option for UMD modules' );
		}

		reorderImports__default( mod.imports );

		// gather imports, and remove import declarations
		mod.imports.forEach( function( x, i )  {
			importPaths[i] = x.path;

			if ( x.specifiers.length ) {
				importNames[i] = mod.getName( x );
			}
		});

		intro = strictMode_umd__introTemplate({
			amdDeps: [ 'exports' ].concat( importPaths ).map( strictMode_umd__quote ).join( ', ' ),
			cjsDeps: [ 'exports' ].concat( importPaths.map( strictMode_umd__req ) ).join( ', ' ),
			globals: [ ("global." + (options.name)) ].concat( importNames.map( strictMode_umd__globalify ) ).join( ', ' ),
			names: [ 'exports' ].concat( importNames ).join( ', ' ),
			name: options.name
		}).replace( /\t/g, body.indentStr );

		utils_transformBody__default( mod, body, {
			intro: intro,
			outro: '\n\n}));'
		});

		return packageResult__default( body, options, 'toUmd' );
	}
	var strictMode_umd__default = strictMode_umd__umd;

	function strictMode_umd__quote ( str ) {
		return "'" + str + "'";
	}

	function strictMode_umd__req ( path ) {
		return 'require(\'' + path + '\')';
	}

	function strictMode_umd__globalify ( name ) {
		return 'global.' + name;
	}

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
			var name = bundle.uniqueNames[ bundle.entry ];
			if ( bundle.conflicts.hasOwnProperty( name ) ) {
				name += '__default';
			}
			exportStatement = indentStr + 'return ' + name + ';';
			body.append( '\n\n' + exportStatement );
		}

		intro = defaultsMode_amd__introTemplate({
			amdDeps: bundle.externalModules.length ? '[' + bundle.externalModules.map( defaultsMode_amd__quoteId ).join( ', ' ) + '], ' : '',
			names: bundle.externalModules.map( function(m ) {return bundle.uniqueNames[ m.id ] + '__default'} ).join( ', ' )
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
			var name = bundle.uniqueNames[ bundle.entry ];
			if ( bundle.conflicts.hasOwnProperty( name ) ) {
				name += '__default';
			}
			exportStatement = indentStr + 'module.exports = ' + name + ';';
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
			var name = bundle.uniqueNames[ bundle.entry ];
			if ( bundle.conflicts.hasOwnProperty( name ) ) {
				name += '__default';
			}
			exportStatement = indentStr + 'return ' + name + ';';
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

	var getExportBlock__outroTemplate;

	function getExportBlock__getExportBlock ( bundle, entry, indentStr ) {
		var exportBlock = '', statements = [], name;

		name = bundle.uniqueNames[ bundle.entry ];

		// create an export block
		if ( entry.defaultExport ) {
			var defaultName = name;
			if ( bundle.conflicts.hasOwnProperty( name ) ) {
				defaultName += '__default';
			}
			exportBlock = indentStr + 'exports[\'default\'] = ' + defaultName + ';';
		}

		entry.exports.forEach( function(x ) {
			if ( x.default ) {
				return;
			}

			if ( x.declaration ) {
				var declName = bundle.conflicts.hasOwnProperty( x.name ) ?
					name + '__' + x.name :
					x.name;
				statements.push( indentStr + (("__export('" + (x.name)) + ("', function () { return " + declName) + "; });")  );
			}

			else {
				x.specifiers.forEach( function(s ) {
					var declName = bundle.conflicts.hasOwnProperty( s.name ) ?
						name + '__' + s.name :
						s.name;
					statements.push( indentStr + (("__export('" + (s.name)) + ("', function () { return " + declName) + "; });")  );
				});
			}
		});

		if ( statements.length ) {
			if ( exportBlock ) {
				exportBlock += '\n\n';
			}

			exportBlock += getExportBlock__outroTemplate({
				exportStatements: statements.join( '\n' )
			}).replace( /\t/g, indentStr );
		}

		return exportBlock;
	}
	var getExportBlock__default = getExportBlock__getExportBlock;

	getExportBlock__outroTemplate = template__default( ("\
\n\
\n	(function (__export) {\
\n	<%= exportStatements %>\
\n	}(function (prop, get) {\
\n		Object.defineProperty(exports, prop, {\
\n			enumerable: true,\
\n			get: get\
\n		});\
\n	}));\
\n\
\n") );

	var builders_strictMode_amd__introTemplate;

	function builders_strictMode_amd__amd ( bundle, body, options ) {
		var defaultsBlock,
			entry = bundle.entryModule,
			exportBlock,
			externalModules = bundle.externalModules,
			importPaths,
			importNames,
			intro,
			indentStr;

		indentStr = body.getIndentString();

		defaultsBlock = externalModules.map( function(x ) {
			var name = bundle.uniqueNames[ x.id ];
			return indentStr + (("var " + name) + ("__default = ('default' in " + name) + (" ? " + name) + ("['default'] : " + name) + ");");
		}).join( '\n' );

		if ( defaultsBlock ) {
			body.prepend( defaultsBlock + '\n\n' );
		}

		if ( entry.exports.length ) {
			importPaths = [ 'exports' ].concat( externalModules.map( builders_strictMode_amd__getPath ) );
			importNames = [ 'exports' ].concat( externalModules.map( function(m ) {return bundle.uniqueNames[ m.id ]} ) );

			exportBlock = getExportBlock__default( bundle, entry, indentStr );
			body.append( '\n\n' + exportBlock );
		} else {
			importPaths = externalModules.map( builders_strictMode_amd__getPath );
			importNames = externalModules.map( function(m ) {return bundle.uniqueNames[ m.id ]} );
		}

		intro = builders_strictMode_amd__introTemplate({
			amdDeps: importPaths.length ? '[' + importPaths.map( builders_strictMode_amd__quote ).join( ', ' ) + '], ' : '',
			names: importNames.join( ', ' )
		}).replace( /\t/g, indentStr );

		body.prepend( intro ).trim().append( '\n\n});' );
		return packageResult__default( body, options, 'toAmd', true );
	}
	var builders_strictMode_amd__default = builders_strictMode_amd__amd;

	function builders_strictMode_amd__quote ( str ) {
		return "'" + str + "'";
	}

	function builders_strictMode_amd__getPath ( m ) { return m.id; }

	builders_strictMode_amd__introTemplate = template__default( 'define(<%= amdDeps %>function (<%= names %>) {\n\n\t\'use strict\';\n\n' );

	function builders_strictMode_cjs__cjs ( bundle, body, options ) {
		var importBlock,
			entry = bundle.entryModule,
			exportBlock,
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

		if ( entry.exports.length ) {
			exportBlock = getExportBlock__default( bundle, entry, indentStr );
			body.append( '\n\n' + exportBlock );
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
			exportBlock,
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

		importPaths = bundle.externalModules.map( builders_strictMode_umd__getId );
		importNames = bundle.externalModules.map( function(m ) {return bundle.uniqueNames[ m.id ]} );

		if ( entry.exports.length ) {
			amdDeps = [ 'exports' ].concat( importPaths ).map( builders_strictMode_umd__quote ).join( ', ' );
			cjsDeps = [ 'exports' ].concat( importPaths.map( builders_strictMode_umd__req ) ).join( ', ' );
			globals = [ options.name ].concat( importNames ).map( builders_strictMode_umd__globalify ).join( ', ' );
			names   = [ 'exports' ].concat( importNames ).join( ', ' );

			exportBlock = getExportBlock__default( bundle, entry, indentStr );
			body.append( '\n\n' + exportBlock );
		} else {
			amdDeps = importPaths.map( builders_strictMode_umd__quote ).join( ', ' );
			cjsDeps = importPaths.map( builders_strictMode_umd__req ).join( ', ' );
			globals = importNames.map( builders_strictMode_umd__globalify ).join( ', ' );
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

	function builders_strictMode_umd__getId ( m ) { return m.id; }

	function builders_strictMode_umd__quote ( str ) {
		return "'" + str + "'";
	}

	function builders_strictMode_umd__req ( path ) {
		return 'require(\'' + path + '\')';
	}

	function builders_strictMode_umd__globalify ( name ) {
		return 'global.' + name;
	}

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