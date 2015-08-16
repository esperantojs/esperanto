/*
	esperanto.js v0.7.5 - 2015-08-16
	http://esperantojs.org

	Released under the MIT License.
*/

'use strict';

var rollup = require('rollup');
var _path = require('path');
var fs = require('fs');
var chalk = require('chalk');
chalk = ('default' in chalk ? chalk['default'] : chalk);
var acorn = require('acorn');
var MagicString = require('magic-string');
MagicString = ('default' in MagicString ? MagicString['default'] : MagicString);

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
			var replacement = x.isEmpty ? req(x.path) + ';' : 'var ' + x.as + ' = ' + req(x.path) + ';';
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
			cjsExport = 'factory(' + (hasExports ? ['exports'] : []).concat(paths.map(req)).join(', ') + ')';
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

function transformBody(mod, body, options) {
	var _gatherImports = gatherImports(mod.imports);

	var chains = _gatherImports[0];
	var identifierReplacements = _gatherImports[1];

	var exportNames = getExportNames(mod.exports);

	var _getReadOnlyIdentifiers = getReadOnlyIdentifiers(mod.imports);

	// ensure no conflict with `exports`
	var importedBindings = _getReadOnlyIdentifiers[0];
	var importedNamespaces = _getReadOnlyIdentifiers[1];
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
				return req(x.path) + ';';
			}

			return 'var ' + x.name + ' = ' + req(x.path) + ';';
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
var toUmd = transpileMethod('umd');function bundle(options) {
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

	return rollup.rollup({
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
				result.code += '\n//# sourceMappingURL=' + result.map.toUrl();
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

exports.bundle = bundle;
exports.toAmd = toAmd;
exports.toCjs = toCjs;
exports.toUmd = toUmd;
//# sourceMappingURL=/www/ESPERANTO/esperanto/.gobble-build/02-esperantoBundle/1/esperanto.js.map