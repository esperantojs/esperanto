/*
	esperanto.js v0.7.4 - 2015-07-29
	http://esperantojs.org

	Released under the MIT License.
*/

'use strict';

var acorn = require('acorn');
var MagicString = require('magic-string');
MagicString = ('default' in MagicString ? MagicString['default'] : MagicString);
var _path = require('path');
var sander = require('sander');

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

var shouldSkip = undefined;
var shouldAbort = undefined;
function walk(ast, _ref) {
	var enter = _ref.enter;
	var leave = _ref.leave;

	shouldAbort = false;
	visit(ast, null, enter, leave);
}

var context = {
	skip: function () {
		return shouldSkip = true;
	},
	abort: function () {
		return shouldAbort = true;
	}
};

var childKeys = {};

var toString = Object.prototype.toString;

function isArray(thing) {
	return toString.call(thing) === '[object Array]';
}

function visit(node, parent, enter, leave) {
	if (!node || shouldAbort) return;

	if (enter) {
		shouldSkip = false;
		enter.call(context, node, parent);
		if (shouldSkip || shouldAbort) return;
	}

	var keys = childKeys[node.type] || (childKeys[node.type] = Object.keys(node).filter(function (key) {
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

		if (isArray(value)) {
			j = value.length;
			while (j--) {
				visit(value[j], node, enter, leave);
			}
		} else if (value && value.type) {
			visit(value, node, enter, leave);
		}
	}

	if (leave && !shouldAbort) {
		leave(node, parent);
	}
}

function getId(m) {
	return m.id;
}

function getName(m) {
	return m.name;
}

function quote(str) {
	return "'" + JSON.stringify(str).slice(1, -1).replace(/'/g, "\\'") + "'";
}

function req(path) {
	return "require(" + quote(path) + ")";
}

function globalify(name) {
	if (/^__dep\d+__$/.test(name)) {
		return "undefined";
	} else {
		return "global." + name;
	}
}

/*
	This module traverse a module's AST, attaching scope information
	to nodes as it goes, which is later used to determine which
	identifiers need to be rewritten to avoid collisions
*/

function Scope(options) {
	options = options || {};

	this.parent = options.parent;
	this.names = options.params || [];
}

Scope.prototype = {
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

	var scope = new Scope();
	var blockScope = new Scope();
	var declared = {};
	var topLevelFunctionNames = [];
	var templateLiteralRanges = [];

	var envDepth = 0;

	walk(ast, {
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

					var names = node.params.map(getName);

					names.forEach(function (name) {
						return declared[name] = true;
					});

					scope = node._scope = new Scope({
						parent: scope,
						params: names // TODO rest params?
					});

					break;

				case 'BlockStatement':
					blockScope = node._blockScope = new Scope({
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

	walk(mod.ast, {
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

function promiseSequence(arr, callback) {
	var len = arr.length;
	var results = new Array(len);

	var promise = sander.Promise.resolve();

	function next(i) {
		return promise.then(function () {
			return callback(arr[i], i);
		}).then(function (result) {
			return results[i] = result;
		});
	}

	var i = undefined;

	for (i = 0; i < len; i += 1) {
		promise = next(i);
	}

	return promise.then(function () {
		return results;
	});
}

function sortModules(entry) {
	var seen = {};
	var ordered = [];
	var hasCycles = undefined;

	var strongDeps = {};
	var stronglyDependsOn = {};

	function visit(mod) {
		var id = mod.id;

		seen[id] = true;

		strongDeps[id] = [];
		stronglyDependsOn[id] = {};

		mod.imports.forEach(function (x) {
			var imported = x.module;

			if (imported.isExternal || imported.isSkipped) return;

			// if `mod` references a binding from `imported` at the top
			// level (i.e. outside function bodies), we say that `mod`
			// strongly depends on `imported. If two modules depend on
			// each other, this helps us order them such that if a
			// strongly depends on b, and b weakly depends on a, b
			// goes first
			if (referencesAtTopLevel(mod, imported)) {
				strongDeps[id].push(imported);
			}

			if (hasOwnProp.call(seen, imported.id)) {
				// we need to prevent an infinite loop, and note that
				// we need to check for strong/weak dependency relationships
				hasCycles = true;
				return;
			}

			visit(imported);
		});

		// add second (and third...) order dependencies
		function addStrongDependencies(dependency) {
			if (hasOwnProp.call(stronglyDependsOn[id], dependency.id)) return;

			stronglyDependsOn[id][dependency.id] = true;
			strongDeps[dependency.id].forEach(addStrongDependencies);
		}

		strongDeps[id].forEach(addStrongDependencies);

		ordered.push(mod);
	}

	visit(entry);

	var unordered = undefined;

	if (hasCycles) {
		unordered = ordered;
		ordered = [];

		// unordered is actually semi-ordered, as [ fewer dependencies ... more dependencies ]
		unordered.forEach(function (x) {
			// ensure strong dependencies of x that don't strongly depend on x go first
			strongDeps[x.id].forEach(place);

			function place(dep) {
				if (!stronglyDependsOn[dep.id][x.id] && ! ~ordered.indexOf(dep)) {
					strongDeps[dep.id].forEach(place);
					ordered.push(dep);
				}
			}

			if (! ~ordered.indexOf(x)) {
				ordered.push(x);
			}
		});
	}

	return ordered;
}

function referencesAtTopLevel(a, b) {
	var bindings = [];

	// find out which bindings a imports from b
	var i = a.imports.length;
	while (i--) {
		if (a.imports[i].module === b) {
			bindings.push.apply(bindings, a.imports[i].specifiers.map(function (x) {
				return x.as;
			}));
		}
	}

	// see if any of those bindings are referenced at the top level
	var referencedAtTopLevel = false;

	walk(a.ast, {
		enter: function (node) {
			if (/^Import/.test(node.type) || node._scope && node._scope.parent) {
				return this.skip();
			}

			if (node.type === 'Identifier' && ~bindings.indexOf(node.name)) {
				referencedAtTopLevel = true;
				this.abort();
			}
		}
	});

	return referencedAtTopLevel;
}

function resolveChains(modules, moduleLookup) {
	var chains = {};

	// First pass - resolving intra-module chains
	modules.forEach(function (mod) {
		var origin = {};

		mod.imports.forEach(function (x) {
			var imported = x.module;

			x.specifiers.forEach(function (s) {
				if (s.isBatch) {
					// tell that module that it needs to export an object full of getters
					imported._exportsNamespace = true;
					return; // TODO can batch imports be chained?
				}

				origin[s.as] = '' + s.name + '@' + imported.id;
			});
		});

		mod.exports.forEach(function (x) {
			if (!x.specifiers) return;

			x.specifiers.forEach(function (s) {
				if (hasOwnProp.call(origin, s.name)) {
					chains['' + s.as + '@' + mod.id] = origin[s.name];
				} else if (s.as !== s.name) {
					chains['' + s.as + '@' + mod.id] = '' + s.name + '@' + mod.id;
				}
			});
		});
	});

	// Second pass - assigning origins to specifiers
	modules.forEach(function (mod) {
		mod.imports.forEach(function (x) {
			var imported = x.module;

			x.specifiers.forEach(function (s) {
				if (s.isBatch) {
					return; // TODO can batch imports be chained?
				}

				setOrigin(s, '' + s.name + '@' + imported.id, chains, moduleLookup);
			});
		});

		mod.exports.forEach(function (x) {
			if (!x.specifiers) return;

			x.specifiers.forEach(function (s) {
				setOrigin(s, '' + s.as + '@' + mod.id, chains, moduleLookup);
			});
		});
	});
}

function setOrigin(specifier, hash, chains, moduleLookup) {
	var isChained = undefined;

	while (hasOwnProp.call(chains, hash)) {
		hash = chains[hash];
		isChained = true;
	}

	if (isChained) {
		var _hash$split = hash.split('@');

		var _name = _hash$split[0];
		var moduleId = _hash$split[1];

		specifier.origin = { module: moduleLookup[moduleId], name: _name };
	}
}

// from https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects
// we add `exports` to this list, to avoid conflicts
var builtins = 'Array ArrayBuffer DataView Date Error EvalError Float32Array Float64Array Function Generator GeneratorFunction Infinity Int16Array Int32Array Int8Array InternalError Intl Iterator JSON Map Math NaN Number Object ParallelArray Promise Proxy RangeError ReferenceError Reflect RegExp Set StopIteration String Symbol SyntaxError TypeError TypedArray URIError Uint16Array Uint32Array Uint8Array Uint8ClampedArray WeakMap WeakSet decodeURI decodeURIComponent encodeURI encodeURIComponent escape eval exports isFinite isNaN null parseFloat parseInt undefined unescape uneval'.split(' ');

var populateModuleNames = getUniqueNames;
function getUniqueNames(bundle) {
	var modules = bundle.modules;
	var externalModules = bundle.externalModules;

	var userNames = bundle.names;
	var names = {};

	var used = modules.reduce(function (declared, mod) {
		var defaultExport = mod.defaultExport;
		var defaultExportName = defaultExport && !defaultExport.unsafe && defaultExport.type === 'expression' && defaultExport.node.declaration && defaultExport.node.declaration.type === 'Identifier' && defaultExport.node.declaration.name;

		Object.keys(mod.ast._declared).forEach(function (x) {
			// special case - `export default foo`
			if (x === defaultExportName) return;
			declared[x] = true;
		});
		return declared;
	}, {});

	// copy builtins
	builtins.forEach(function (n) {
		return used[n] = true;
	});

	// copy user-specified names
	if (userNames) {
		Object.keys(userNames).forEach(function (id) {
			names[id] = userNames[id];
			used[userNames[id]] = true;
		});
	}

	// infer names from default imports - e.g. with `import _ from './utils'`,
	// use '_' instead of generating a name from 'utils'
	function inferName(x) {
		if (x.isDefault && !hasOwnProp.call(names, x.module.id) && !hasOwnProp.call(used, x.as)) {
			names[x.module.id] = x.as;
			used[x.as] = true;
		}
	}
	modules.forEach(function (mod) {
		mod.imports.forEach(inferName);
	});

	// for the rest, make names as compact as possible without
	// introducing conflicts
	modules.concat(externalModules).forEach(function (mod) {
		// is this already named?
		if (hasOwnProp.call(names, mod.id)) {
			mod.name = names[mod.id];
			return;
		}

		var name = undefined;
		var parts = splitPath(mod.id);
		var i = parts.length;

		while (i--) {
			name = sanitize(parts.slice(i).join('_'));

			if (!hasOwnProp.call(used, name)) {
				break;
			}
		}

		while (hasOwnProp.call(used, name)) {
			name = '_' + name;
		}

		used[name] = true;
		mod.name = name;
	});

	return names;
}

function populateExternalModuleImports(bundle) {
	bundle.modules.forEach(function (mod) {
		mod.imports.forEach(function (x) {
			var externalModule = x.module;

			if (!externalModule.isExternal) {
				return;
			}

			x.specifiers.forEach(function (s) {
				if (s.isDefault) {
					externalModule.needsDefault = true;
				} else {
					externalModule.needsNamed = true;
				}
			});
		});
	});
}

function getRenamedImports(mod) {
	var renamed = [];

	mod.imports.forEach(function (x) {
		if (x.specifiers) {
			x.specifiers.forEach(function (s) {
				if (s.name !== s.as && ! ~renamed.indexOf(s.name)) {
					renamed.push(s.name);
				}
			});
		}
	});

	return renamed;
}

function topLevelScopeConflicts(bundle) {
	var conflicts = {};
	var inBundle = {};
	var importNames = bundle.externalModules.map(getName);

	bundle.modules.forEach(function (mod) {
		var names = builtins

		// all top defined identifiers are in top scope
		.concat(mod.ast._topLevelNames)

		// all unattributed identifiers could collide with top scope
		.concat(getUnscopedNames(mod)).concat(importNames).concat(getRenamedImports(mod));

		if (mod._exportsNamespace) {
			conflicts[mod.name] = true;
		}

		// merge this module's top scope with bundle top scope
		names.forEach(function (name) {
			if (hasOwnProp.call(inBundle, name)) {
				conflicts[name] = true;
			} else {
				inBundle[name] = true;
			}
		});
	});

	return conflicts;
}

function populateIdentifierReplacements(bundle) {
	// first, discover conflicts
	var conflicts = topLevelScopeConflicts(bundle);

	// then figure out what identifiers need to be created
	// for default exports
	bundle.modules.forEach(function (mod) {
		var x = mod.defaultExport;

		if (x) {
			var result = undefined;

			if (x.hasDeclaration && x.name) {
				result = hasOwnProp.call(conflicts, x.name) || otherModulesDeclare(mod, x.name) ? '' + mod.name + '__' + x.name : x.name;
			} else {
				result = hasOwnProp.call(conflicts, mod.name) || x.value !== mod.name && ~mod.ast._topLevelNames.indexOf(mod.name) || otherModulesDeclare(mod, mod.name) ? '' + mod.name + '__default' : mod.name;
			}

			mod.identifierReplacements['default'] = result;
		}
	});

	// then determine which existing identifiers
	// need to be replaced
	bundle.modules.forEach(function (mod) {
		var moduleIdentifiers = mod.identifierReplacements;

		mod.ast._topLevelNames.forEach(function (n) {
			moduleIdentifiers[n] = hasOwnProp.call(conflicts, n) ? '' + mod.name + '__' + n : n;
		});

		mod.imports.forEach(function (x) {
			if (x.passthrough) {
				return;
			}

			var imported = x.module;

			x.specifiers.forEach(function (s) {
				var replacement = undefined;

				if (s.isBatch) {
					replacement = x.module.name;
				} else {
					var _mod = undefined;
					var specifierName = undefined;

					if (s.origin) {
						// chained bindings
						_mod = s.origin.module;
						specifierName = s.origin.name;
					} else {
						_mod = imported;
						specifierName = s.name;
					}

					var moduleName = _mod && _mod.name;

					if (specifierName === 'default') {
						// if it's an external module, always use __default if the
						// bundle also uses named imports
						if (imported.isExternal) {
							replacement = imported.needsNamed ? '' + moduleName + '__default' : moduleName;
						}

						// TODO We currently need to check for the existence of `mod`, because modules
						// can be skipped. Would be better to replace skipped modules with dummies
						// - see https://github.com/Rich-Harris/esperanto/issues/32
						else if (_mod && !_mod.isSkipped) {
							replacement = _mod.identifierReplacements['default'];
						}
					} else if (!imported.isExternal) {
						replacement = hasOwnProp.call(conflicts, specifierName) ? '' + moduleName + '__' + specifierName : specifierName;
					} else {
						replacement = moduleName + '.' + specifierName;
					}
				}

				if (replacement !== s.as) {
					moduleIdentifiers[s.as] = replacement;
				}
			});
		});
	});

	function otherModulesDeclare(mod, replacement) {
		var i, otherMod;

		i = bundle.modules.length;
		while (i--) {
			otherMod = bundle.modules[i];

			if (mod === otherMod) {
				continue;
			}

			if (hasOwnProp.call(otherMod.ast._declared, replacement)) {
				return true;
			}
		}
	}
}

function resolveExports(bundle) {
	var bundleExports = {};

	bundle.entryModule.exports.forEach(function (x) {
		if (x.specifiers) {
			x.specifiers.forEach(function (s) {
				var module = undefined;
				var name = undefined;

				if (s.origin) {
					module = s.origin.module;
					name = s.origin.name;
				} else {
					module = bundle.entryModule;
					name = s.name;
				}

				addExport(module, name, s.as);
			});
		} else if (!x.isDefault && x.name) {
			addExport(bundle.entryModule, x.name, x.name);
		}
	});

	function addExport(module, name, as) {
		if (!bundleExports[module.id]) {
			bundleExports[module.id] = {};
		}

		bundleExports[module.id][name] = as;
	}

	return bundleExports;
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

var bindingMessage = 'Cannot reassign imported binding ',
    namespaceMessage = 'Cannot reassign imported binding of namespace ';
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
		throw new Error((isNamespaceAssignment ? namespaceMessage : bindingMessage) + '`' + name + '`');
	}
}

function replaceIdentifiers(body, node, identifierReplacements, scope) {
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

	walk(ast, {
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
				replaceIdentifiers(body, node, identifierReplacements, scope);
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

var transformBody__default = transformBody__transformBody;
function transformBody__transformBody(bundle, mod, body) {
	var identifierReplacements = mod.identifierReplacements;

	var _getReadOnlyIdentifiers = getReadOnlyIdentifiers(mod.imports);

	var importedBindings = _getReadOnlyIdentifiers[0];
	var importedNamespaces = _getReadOnlyIdentifiers[1];

	var exportNames = hasOwnProp.call(bundle.exports, mod.id) && bundle.exports[mod.id];

	traverseAst(mod.ast, body, identifierReplacements, importedBindings, importedNamespaces, exportNames);

	// Remove import statements
	mod.imports.forEach(function (x) {
		if (!x.passthrough) {
			body.remove(x.start, x.next);
		}
	});

	var shouldExportEarly = {};

	// Remove export statements
	mod.exports.forEach(function (x) {
		var name;

		if (x.isDefault) {
			if (x.type === 'namedFunction' || x.type === 'namedClass') {
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
				body.remove(x.start, x.valueStart);
			} else if (x.node.declaration && (name = x.node.declaration.name)) {
				if (name === identifierReplacements['default']) {
					body.remove(x.start, x.end);
				} else {
					var original = hasOwnProp.call(identifierReplacements, name) ? identifierReplacements[name] : name;
					body.replace(x.start, x.end, 'var ' + identifierReplacements['default'] + ' = ' + original + ';');
				}
			} else {
				body.replace(x.start, x.valueStart, 'var ' + identifierReplacements['default'] + ' = ');
			}

			return;
		}

		if (x.hasDeclaration) {
			if (x.type === 'namedFunction') {
				shouldExportEarly[x.name] = true; // TODO what about `function foo () {}; export { foo }`?
			}

			body.remove(x.start, x.valueStart);
		} else {
			body.remove(x.start, x.next);
		}
	});

	// If this module exports a namespace - i.e. another module does
	// `import * from 'foo'` - then we need to make all this module's
	// exports available, using Object.defineProperty
	var indentStr = body.getIndentString();
	if (mod._exportsNamespace) {
		(function () {
			var namespaceExportBlock = 'var ' + mod.name + ' = {\n',
			    namespaceExports = [];

			mod.exports.forEach(function (x) {
				if (x.hasDeclaration) {
					namespaceExports.push(indentStr + ('get ' + x.name + ' () { return ' + identifierReplacements[x.name] + '; }'));
				} else if (x.isDefault) {
					namespaceExports.push(indentStr + ('get default () { return ' + identifierReplacements['default'] + '; }'));
				} else {
					x.specifiers.forEach(function (s) {
						var original = hasOwnProp.call(identifierReplacements, s.name) ? identifierReplacements[s.name] : s.name;
						namespaceExports.push(indentStr + ('get ' + s.as + ' () { return ' + original + '; }'));
					});
				}
			});

			namespaceExportBlock += namespaceExports.join(',\n') + '\n};\n\n';

			body.prepend(namespaceExportBlock);
		})();
	}

	// If this module is responsible for one of the bundle's exports
	// (it doesn't have to be the entry module, which could re-export
	// a binding from another module), we write exports here
	if (exportNames) {
		(function () {
			var exportBlock = [];

			Object.keys(exportNames).forEach(function (name) {
				var exportAs = exportNames[name];
				exportBlock.push('exports.' + exportAs + ' = ' + identifierReplacements[name] + ';');
			});

			if (exportBlock.length) {
				body.trim().append('\n\n' + exportBlock.join('\n'));
			}
		})();
	}

	return body.trim();
}

function combine(bundle) {
	bundle.body = new MagicString.Bundle({
		separator: '\n\n'
	});

	// give each module in the bundle a unique name
	populateModuleNames(bundle);

	// determine which specifiers are imported from
	// external modules
	populateExternalModuleImports(bundle);

	// determine which identifiers need to be replaced
	// inside this bundle
	populateIdentifierReplacements(bundle);

	bundle.exports = resolveExports(bundle);

	bundle.modules.forEach(function (mod) {
		// verify that this module doesn't import non-exported identifiers
		mod.imports.forEach(function (x) {
			var imported = x.module;

			if (imported.isExternal || imported.isSkipped || x.isBatch) {
				return;
			}

			x.specifiers.forEach(function (s) {
				if (!imported.doesExport[s.name]) {
					throw new Error('Module \'' + imported.id + '\' does not export \'' + s.name + '\' (imported by \'' + mod.id + '\')');
				}
			});
		});

		bundle.body.addSource({
			filename: mod.path,
			content: transformBody__default(bundle, mod, mod.body),
			indentExclusionRanges: mod.ast._templateLiteralRanges
		});
	});
}

function getModule(mod) {
	mod.body = new MagicString(mod.code);

	var toRemove = [];

	try {
		mod.ast = mod.ast || acorn.parse(mod.code, {
			ecmaVersion: 6,
			sourceType: 'module',
			onComment: function (block, text, start, end) {
				// sourceMappingURL comments should be removed
				if (!block && /^# sourceMappingURL=/.test(text)) {
					toRemove.push({ start: start, end: end });
				}
			}
		});
	} catch (err) {
		// If there's a parse error, attach file info
		// before throwing the error
		if (err.loc) {
			err.file = mod.path;
		}

		throw err;
	}

	// remove sourceMappingURL comments
	toRemove.forEach(function (_ref) {
		var start = _ref.start;
		var end = _ref.end;
		return mod.body.remove(start, end);
	});

	var _findImportsAndExports = findImportsAndExports(mod.ast, mod.code);

	var imports = _findImportsAndExports.imports;
	var exports = _findImportsAndExports.exports;
	var defaultExport = _findImportsAndExports.defaultExport;

	disallowConflictingImports(imports);

	mod.imports = imports;
	mod.exports = exports;
	mod.defaultExport = defaultExport;

	var defaultExportIdentifier = defaultExport && defaultExport.type === 'expression' && defaultExport.node.declaration && defaultExport.node.declaration.type === 'Identifier' && defaultExport.node.declaration;

	// if the default export is an expression like `export default foo`, we
	// can *probably* just use `foo` to refer to said export throughout the
	// bundle. Tracking assignments to `foo` allows us to be sure that that's
	// the case (i.e. that the module doesn't assign a different value to foo
	// after it's been exported)
	annotateAst(mod.ast, {
		trackAssignments: defaultExportIdentifier
	});

	if (defaultExportIdentifier && defaultExportIdentifier._assignments) {
		var i = defaultExportIdentifier._assignments.length;
		while (i--) {
			var assignment = defaultExportIdentifier._assignments[i];

			// if either a) the assignment happens inside a function body, or
			// b) it happens after the `export default ...`, then it's unsafe to
			// use the identifier, and we need to essentially do `var _foo = foo`
			if (assignment.scope.parent || assignment.node.start > defaultExport.start) {
				defaultExport.unsafe = true; // TODO better property name than 'unsafe'
				break;
			}
		}
	}

	// identifiers to replace within this module
	// (gets filled in later, once bundle is combined)
	mod.identifierReplacements = {};

	// collect exports by name, for quick lookup when verifying
	// that this module exports a given identifier
	mod.doesExport = {};

	exports.forEach(function (x) {
		if (x.isDefault) {
			mod.doesExport['default'] = true;
		} else if (x.name) {
			mod.doesExport[x.name] = true;
		} else if (x.specifiers) {
			x.specifiers.forEach(function (s) {
				mod.doesExport[s.as] = true;
			});
		} else {
			throw new Error('Unexpected export type');
		}
	});

	return mod;
}

function getBundle(options) {
	var entry = options.entry.replace(/\.js$/, '');
	var userModules = options.modules || {};
	var modules = [];
	var moduleLookup = {};
	var promiseByPath = {};
	var skip = options.skip;
	var names = options.names;
	var base = (options.base ? _path.resolve(options.base) : process.cwd()) + '/';
	var externalModules = [];
	var externalModuleLookup = {};

	if (!entry.indexOf(base)) {
		entry = entry.substring(base.length);
	}

	// resolve user module paths
	options.modules && Object.keys(options.modules).forEach(function (relativePath) {
		userModules[_path.resolve(base, relativePath)] = options.modules[relativePath];
	});

	var cyclicalModules = [];

	return resolvePath(base, userModules, entry, null).then(function (absolutePath) {
		return fetchModule(entry, absolutePath).then(function (entryModule) {
			return sander.Promise.all(cyclicalModules).then(function () {
				// if the bundle contains cyclical modules,
				// we may need to sort it again
				if (cyclicalModules.length) {
					modules = sortModules(entryModule);
				}

				var bundle = {
					entryModule: entryModule,
					modules: modules,
					externalModules: externalModules,
					names: names
				};

				resolveChains(modules, moduleLookup);
				combine(bundle);

				return bundle;
			});
		});
	}, function (err) {
		if (err.code === 'ENOENT') {
			throw new Error('Could not find entry module (' + entry + ')');
		}

		throw err;
	});

	function fetchModule(moduleId, absolutePath) {
		if (!hasOwnProp.call(promiseByPath, absolutePath)) {
			promiseByPath[absolutePath] = (hasOwnProp.call(userModules, absolutePath) ? sander.Promise.resolve(userModules[absolutePath]) : sander.readFile(absolutePath).then(String)).then(function (source) {
				var code = undefined,
				    ast = undefined;

				// normalise
				if (typeof source === 'object') {
					code = source.code;
					ast = source.ast;
				} else {
					code = source;
					ast = null;
				}

				if (options.transform) {
					code = options.transform(code, absolutePath);

					if (typeof code !== 'string' && !isThenable(code)) {
						throw new Error('transform should return String or Promise');
					}
				}

				var module = getModule({
					id: moduleId,
					path: absolutePath,
					code: code,
					ast: ast
				});

				moduleLookup[moduleId] = module;

				return promiseSequence(module.imports, function (x) {
					var id = resolveId(x.path, module.path).replace(base, '');

					if (id === moduleId) {
						throw new Error('A module (' + moduleId + ') cannot import itself');
					}

					// Some modules can be skipped
					if (skip && ~skip.indexOf(id)) {
						var skippedModule = {
							id: id,
							isSkipped: true
						};

						x.module = skippedModule;
						return skippedModule;
					}

					return resolvePath(base, userModules, id, absolutePath, options.resolvePath).then(function (absolutePath) {
						var promise = hasOwnProp.call(promiseByPath, absolutePath) && promiseByPath[absolutePath];
						var cyclical = !!promise;

						if (cyclical) {
							// ensure all modules are set before we
							// create the bundle...
							cyclicalModules.push(promise.then(function (module) {
								return x.module = module;
							}));

							// ...then short-circuit
							return;
						}

						return fetchModule(id, absolutePath).then(function (module) {
							return x.module = module;
						});
					}, function handleError(err) {
						if (err.code === 'ENOENT') {
							// Most likely an external module
							var externalModule = hasOwnProp.call(externalModuleLookup, id) && externalModuleLookup[id];

							if (!externalModule) {
								externalModule = {
									id: id,
									isExternal: true
								};

								externalModules.push(externalModule);
								externalModuleLookup[id] = externalModule;
							}

							x.module = externalModule;
						} else {
							throw err;
						}
					});
				}).then(function () {
					return modules.push(module);
				}).then(function () {
					return module;
				});
			});
		}

		return promiseByPath[absolutePath];
	}
}

function resolvePath(base, userModules, moduleId, importerPath, resolver) {
	var noExt = moduleId.replace(/\.js$/, '');

	return tryPath(base, noExt + '.js', userModules)['catch'](function () {
		return tryPath(base, noExt + _path.sep + 'index.js', userModules);
	})['catch'](function (err) {
		var resolvedPromise = resolver && sander.Promise.resolve(resolver(moduleId, importerPath));

		if (resolvedPromise) {
			return resolvedPromise.then(function (resolvedPath) {
				if (!resolvedPath) {
					// hack but whatevs, it saves handling real ENOENTs differently
					var _err = new Error();
					_err.code = 'ENOENT';
					throw _err;
				}

				return sander.stat(resolvedPath).then(function () {
					return _path.resolve(base, resolvedPath);
				});
			});
		} else {
			throw err;
		}
	});
}

function tryPath(base, filename, userModules) {
	var absolutePath = _path.resolve(base, filename);

	if (hasOwnProp.call(userModules, absolutePath)) {
		return sander.Promise.resolve(absolutePath);
	}
	return sander.stat(absolutePath).then(function () {
		return absolutePath;
	});
}

function isThenable(obj) {
	return obj && typeof obj.then === 'function';
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

var warned = {};
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
			source: sourceMapFile && !isBundle ? getRelativePath(sourceMapFile, options.sourceMapSource) : null
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
			if (!warned[methodName]) {
				console.log('Warning: esperanto.' + methodName + '() returns an object with a \'code\' property. You should use this instead of using the returned value directly');
				warned[methodName] = true;
			}

			return code;
		}
	};
}

function getRelativePath(from, to) {
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
		walk(mod.ast, {
			enter: function (node) {
				mod.body.addSourcemapLocation(node.start);
			}
		});
	});
}

function markModuleSourcemapLocations(mod) {
	walk(mod.ast, {
		enter: function (node) {
			mod.body.addSourcemapLocation(node.start);
		}
	});
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

	var intro = '\ndefine(' + processName(name) + '' + processIds(ids) + 'function (' + names.join(', ') + ') {\n\n';

	if (useStrict) {
		intro += '' + indentStr + '\'use strict\';\n\n';
	}

	return intro;
}

var amd__default = amd__amd;
function amd__amd(mod, options) {
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

var cjs__default = cjs__cjs;
function cjs__cjs(mod, options) {
	var seen = {};

	mod.imports.forEach(function (x) {
		if (!hasOwnProp.call(seen, x.path)) {
			var replacement = x.isEmpty ? '' + req(x.path) + ';' : 'var ' + x.as + ' = ' + req(x.path) + ';';
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
		mod.body.prepend('\'use strict\';\n\n').trimLines();
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
			cjsExport = 'factory(' + (hasExports ? ['exports'] : []).concat(paths.map(req)).join(', ') + ')';
			var globalDeps = (hasExports ? ['(global.' + name + ' = {})'] : []).concat(names.map(globalify)).join(', ');
			globalExport = 'factory(' + globalDeps + ')';

			if (hasExports) {
				ids.unshift('exports');
				names.unshift('exports');
			}

			amdExport = 'define(' + processName(amdName) + '' + processIds(ids) + 'factory)';
			defaultsBlock = '';
			if (externalDefaults && externalDefaults.length > 0) {
				defaultsBlock = externalDefaults.map(function (x) {
					return '\t' + (x.needsNamed ? 'var ' + x.name + '__default' : x.name) + (' = (\'default\' in ' + x.name + ' ? ' + x.name + '[\'default\'] : ' + x.name + ');');
				}).join('\n') + '\n\n';
			}
		} else {
			amdExport = 'define(' + processName(amdName) + '' + processIds(ids) + 'factory)';
			cjsExport = (hasExports ? 'module.exports = ' : '') + ('factory(' + paths.map(req).join(', ') + ')');
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

var umd__default = umd__umd;
function umd__umd(mod, options) {
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
	amd: amd__default,
	cjs: cjs__default,
	umd: umd__default
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

var utils_transformBody = utils_transformBody__transformBody;

function utils_transformBody__transformBody(mod, body, options) {
	var _gatherImports = gatherImports(mod.imports);

	var chains = _gatherImports[0];
	var identifierReplacements = _gatherImports[1];

	var exportNames = getExportNames(mod.exports);

	var _getReadOnlyIdentifiers = getReadOnlyIdentifiers(mod.imports);

	var importedBindings = _getReadOnlyIdentifiers[0];
	var importedNamespaces = _getReadOnlyIdentifiers[1];

	// ensure no conflict with `exports`
	identifierReplacements.exports = deconflict('exports', mod.ast._declared);

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
				var exportSegment = exportAs === 'default' ? '[\'default\']' : '.' + exportAs;
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

function deconflict(name, declared) {
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

	utils_transformBody(mod, mod.body, {
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
				return '' + req(x.path) + ';';
			}

			return 'var ' + x.name + ' = ' + req(x.path) + ';';
		}
	}).filter(Boolean).join('\n');

	utils_transformBody(mod, mod.body, {
		header: importBlock,
		_evilES3SafeReExports: options._evilES3SafeReExports
	});

	if (options.useStrict !== false) {
		mod.body.prepend('\'use strict\';\n\n').trimLines();
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

	utils_transformBody(mod, mod.body, {
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

var defaultsMode_amd = defaultsMode_amd__amd;
function defaultsMode_amd__amd(bundle, options) {
	var defaultName = bundle.entryModule.identifierReplacements['default'];
	if (defaultName) {
		bundle.body.append('\n\nreturn ' + defaultName + ';');
	}

	var intro = amdIntro({
		name: options.amdName,
		imports: bundle.externalModules,
		indentStr: bundle.body.getIndentString(),
		useStrict: options.useStrict !== false
	});

	bundle.body.indent().prepend(intro).trimLines().append('\n\n});');
	return packageResult(bundle, bundle.body, options, 'toAmd', true);
}

var defaultsMode_cjs = defaultsMode_cjs__cjs;
function defaultsMode_cjs__cjs(bundle, options) {
	var importBlock = bundle.externalModules.map(function (x) {
		return 'var ' + x.name + ' = ' + req(x.id) + ';';
	}).join('\n');

	if (importBlock) {
		bundle.body.prepend(importBlock + '\n\n');
	}

	var defaultName = bundle.entryModule.identifierReplacements['default'];
	if (defaultName) {
		bundle.body.append('\n\nmodule.exports = ' + defaultName + ';');
	}

	if (options.useStrict !== false) {
		bundle.body.prepend('\'use strict\';\n\n').trimLines();
	}

	return packageResult(bundle, bundle.body, options, 'toCjs', true);
}

var defaultsMode_umd = defaultsMode_umd__umd;
function defaultsMode_umd__umd(bundle, options) {
	requireName(options);

	var entry = bundle.entryModule;

	var intro = umdIntro({
		hasExports: entry.exports.length > 0,
		imports: bundle.externalModules,
		amdName: options.amdName,
		name: options.name,
		indentStr: bundle.body.getIndentString(),
		useStrict: options.useStrict !== false
	});

	if (entry.defaultExport) {
		bundle.body.append('\n\nreturn ' + entry.identifierReplacements['default'] + ';');
	}

	bundle.body.indent().prepend(intro).trimLines().append('\n\n}));');

	return packageResult(bundle, bundle.body, options, 'toUmd', true);
}

var builders_defaultsMode = {
	amd: defaultsMode_amd,
	cjs: defaultsMode_cjs,
	umd: defaultsMode_umd
};

function getExportBlock(entry) {
	var name = entry.identifierReplacements["default"];
	return "exports['default'] = " + name + ";";
}

var builders_strictMode_amd = builders_strictMode_amd__amd;

function builders_strictMode_amd__amd(bundle, options) {
	var externalDefaults = bundle.externalModules.filter(builders_strictMode_amd__needsDefault);
	var entry = bundle.entryModule;

	if (externalDefaults.length) {
		var defaultsBlock = externalDefaults.map(function (x) {
			// Case 1: default is used, and named is not
			if (!x.needsNamed) {
				return '' + x.name + ' = (\'default\' in ' + x.name + ' ? ' + x.name + '[\'default\'] : ' + x.name + ');';
			}

			// Case 2: both default and named are used
			return 'var ' + x.name + '__default = (\'default\' in ' + x.name + ' ? ' + x.name + '[\'default\'] : ' + x.name + ');';
		}).join('\n');

		bundle.body.prepend(defaultsBlock + '\n\n');
	}

	if (entry.defaultExport) {
		bundle.body.append('\n\n' + getExportBlock(entry));
	}

	var intro = amdIntro({
		name: options.amdName,
		imports: bundle.externalModules,
		hasExports: entry.exports.length,
		indentStr: bundle.body.getIndentString(),
		useStrict: options.useStrict !== false
	});

	bundle.body.indent().prepend(intro).trimLines().append('\n\n});');
	return packageResult(bundle, bundle.body, options, 'toAmd', true);
}

function builders_strictMode_amd__needsDefault(externalModule) {
	return externalModule.needsDefault;
}

var builders_strictMode_cjs = builders_strictMode_cjs__cjs;
function builders_strictMode_cjs__cjs(bundle, options) {
	var entry = bundle.entryModule;

	var importBlock = bundle.externalModules.map(function (x) {
		var statement = 'var ' + x.name + ' = ' + req(x.id) + ';';

		if (x.needsDefault) {
			statement += '\n' + (x.needsNamed ? 'var ' + x.name + '__default' : x.name) + (' = (\'default\' in ' + x.name + ' ? ' + x.name + '[\'default\'] : ' + x.name + ');');
		}

		return statement;
	}).join('\n');

	if (importBlock) {
		bundle.body.prepend(importBlock + '\n\n');
	}

	if (entry.defaultExport) {
		bundle.body.append('\n\n' + getExportBlock(entry));
	}

	if (options.useStrict !== false) {
		bundle.body.prepend('\'use strict\';\n\n').trimLines();
	}

	return packageResult(bundle, bundle.body, options, 'toCjs', true);
}

var builders_strictMode_umd = builders_strictMode_umd__umd;

function builders_strictMode_umd__umd(bundle, options) {
	requireName(options);

	var entry = bundle.entryModule;

	var intro = umdIntro({
		hasExports: entry.exports.length > 0,
		imports: bundle.externalModules,
		externalDefaults: bundle.externalModules.filter(builders_strictMode_umd__needsDefault),
		amdName: options.amdName,
		name: options.name,
		indentStr: bundle.body.getIndentString(),
		strict: true,
		useStrict: options.useStrict !== false
	});

	if (entry.defaultExport) {
		bundle.body.append('\n\n' + getExportBlock(entry));
	}

	bundle.body.indent().prepend(intro).trimLines().append('\n\n}));');

	return packageResult(bundle, bundle.body, options, 'toUmd', true);
}

function builders_strictMode_umd__needsDefault(externalModule) {
	return externalModule.needsDefault;
}

var builders_strictMode = {
	amd: builders_strictMode_amd,
	cjs: builders_strictMode_cjs,
	umd: builders_strictMode_umd
};

// TODO rewrite with named imports/exports
var bundleBuilders = {
	defaultsMode: builders_defaultsMode,
	strictMode: builders_strictMode
};

function concat(bundle, options) {
	// This bundle must be self-contained - no imports or exports
	if (bundle.externalModules.length || bundle.entryModule.exports.length) {
		throw new Error('bundle.concat() can only be used with bundles that have no imports/exports (imports: [' + bundle.externalModules.map(function (x) {
			return x.id;
		}).join(', ') + '], exports: [' + bundle.entryModule.exports.join(', ') + '])');
	}

	// TODO test these options
	var intro = 'intro' in options ? options.intro : '(function () { \'use strict\';\n\n';
	var outro = 'outro' in options ? options.outro : '\n\n})();';
	var indent = undefined;

	if (!('indent' in options) || options.indent === true) {
		indent = bundle.body.getIndentString();
	} else {
		indent = options.indent || '';
	}

	bundle.body.trimLines().indent(indent).prepend(intro).append(outro);

	return packageResult(bundle, bundle.body, options, 'toString', true);
}

var deprecateMessage = 'options.defaultOnly has been deprecated, and is now standard behaviour. To use named imports/exports, pass `strict: true`.';
var alreadyWarned = false;

function transpileMethod(format) {
	return function (source) {
		var options = arguments[1] === undefined ? {} : arguments[1];

		var mod = getStandaloneModule({
			source: source,
			getModuleName: options.getModuleName,
			strict: options.strict
		});

		if ('defaultOnly' in options && !alreadyWarned) {
			// TODO link to a wiki page explaining this, or something
			console.log(deprecateMessage);
			alreadyWarned = true;
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
var toUmd = transpileMethod('umd');function bundle(options) {
	return getBundle(options).then(function (bundle) {
		return {
			imports: bundle.externalModules.map(function (mod) {
				return mod.id;
			}),
			exports: flattenExports(bundle.entryModule.exports),

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
				return concat(bundle, options || {});
			}
		};

		function transpile(format) {
			var options = arguments[1] === undefined ? {} : arguments[1];

			if ('defaultOnly' in options && !alreadyWarned) {
				// TODO link to a wiki page explaining this, or something
				console.log(deprecateMessage);
				alreadyWarned = true;
			}

			var builder = undefined;

			if (!options.strict) {
				// ensure there are no named imports/exports
				if (hasNamedExports(bundle.entryModule)) {
					throw new Error('Entry module can only have named exports in strict mode (pass `strict: true`)');
				}

				bundle.modules.forEach(function (mod) {
					mod.imports.forEach(function (x) {
						if (x.module.isExternal && (!x.isDefault && !x.isBatch)) {
							throw new Error('You can only have named external imports in strict mode (pass `strict: true`)');
						}
					});
				});

				builder = bundleBuilders.defaultsMode[format];
			} else {
				builder = bundleBuilders.strictMode[format];
			}

			return builder(bundle, options);
		}
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

exports.bundle = bundle;
exports.toAmd = toAmd;
exports.toCjs = toCjs;
exports.toUmd = toUmd;
//# sourceMappingURL=/Users/stefanpenner/src/esperanto/.gobble-build/02-esperantoBundle/1/esperanto.js.map