(function(global, factory) {

	'use strict';

	if (typeof define === 'function' && define.amd) {
		define(['acorn'], factory);
	} else if (typeof module !== 'undefined' && module.exports) {
		module.exports = factory(require('acorn'));
	} else {
		global.esperanto = factory(global.acorn);
	}

}(typeof window !== 'undefined' ? window : this, function(acorn) {

	'use strict';

	var transform, utils_guessIndent, utils_applyIndent, generators_amd, generators_cjs, esperanto;
	transform = function(acorn) {
		var __export;
		__export = function(source, options, isAmd) {
			var ast, body, node, nextNode, imports = [],
				hasExports, replaced = '',
				alreadyReturned, i, len, code, SKIP = {};
			source = source.trim();
			ast = acorn.parse(source, {
				ecmaVersion: 6,
				locations: true
			});
			body = ast.body;
			replaced = '';
			len = body.length;
			for (i = 0; i < len; i += 1) {
				node = body[i];
				nextNode = body[i + 1];
				if (isImportDeclaration(node) || isExportDeclaration(node)) {
					code = replace(node, i);
					if (code === SKIP) {
						// In defaultOnly mode, we don't need to bother replacing
						// `import foo from 'foo'` - we just name the import foo
						// in the first place
						while (nextNode && nextNode.type === 'EmptyStatement') {
							nextNode = body[i++];
						}
					} else {
						replaced += code + source.slice(node.end, nextNode ? nextNode.start : source.length);
					}
				} else {
					replaced += source.slice(node.start, nextNode ? nextNode.start : source.length);
				}
			}
			return {
				imports: imports,
				hasExports: hasExports,
				body: replaced,
				alreadyReturned: alreadyReturned
			};

			function replace(node, nodeIndex) {
				if (isImportDeclaration(node)) {
					return replaceImport(node, nodeIndex);
				}
				return replaceExport(node, nodeIndex);
			}

			function replaceImport(node) {
				var _import, result = [],
					indent;
				indent = getIndent(node.start, source);
				if (options.defaultOnly) {
					if (node.kind !== 'default') {
						throw new Error('A named import was used in defaultOnly mode');
					}
					imports.push({
						path: node.source.value,
						name: node.specifiers[0].id.name
					});
					return SKIP;
				}
				_import = {
					path: node.source.value,
					name: '__imports_' + imports.length
				};
				imports.push(_import);
				node.specifiers.forEach(function(specifier) {
					var declaration, id = specifier.id.name,
						name;
					if (options.defaultOnlt) {
						declaration = 'var ' + name + ' = ' + _import.name;
					} else {
						name = specifier.name && specifier.name.name || id;
						declaration = 'var ' + name + ' = ' + _import.name + '.' + (node.kind === 'default' ? 'default' : id);
					}
					result.push(declaration);
				});
				return result.join(';\n' + indent);
			}

			function replaceExport(node, nodeIndex) {
				var indent, declarations = [],
					declaration = '',
					value;
				hasExports = true;
				indent = getIndent(node.start, source);
				if (node.declaration) {
					value = source.slice(node.declaration.start, node.declaration.end);
					// Special case - `export var foo = 'bar'`
					if (node.declaration.type === 'VariableDeclaration') {
						declaration = value + '\n' + indent;
						value = node.declaration.declarations[0].id.name;
					}
					if (options.defaultOnly) {
						// If this is the final node, we can just return from here
						if (nodeIndex === body.length - 1) {
							declaration += (isAmd ? 'return ' : 'module.exports = ') + value;
							alreadyReturned = true;
						} else {
							declaration += '__export = ' + value;
						}
					} else {
						declaration += 'exports.default = ' + value;
					}
					declarations.push(declaration + ';');
				} else {
					if (options.defaultOnly) {
						throw new Error('A named export was used in defaultOnly mode');
					}
					node.specifiers.forEach(function(specifier) {
						var name = specifier.id.name;
						declarations.push('exports.' + name + ' = ' + name);
					});
				}
				return declarations.join(';\n' + indent);
			}
		};

		function isImportDeclaration(node) {
			return node.type === 'ImportDeclaration';
		}

		function isExportDeclaration(node) {
			return node.type === 'ExportDeclaration';
		}

		function getIndent(index, source) {
			var indent = '',
				char;
			index -= 1;
			while ((char = source.charAt(index)) && /[ \t]/.test(char)) {
				indent = char + indent;
				index -= 1;
			}
			if (char === '\n') {
				return indent;
			}
			return '';
		}
		return __export;
	}(acorn);
	utils_guessIndent = function guessIndent(code) {
		var lines, tabbed, spaced, min;
		lines = code.split('\n');
		tabbed = lines.filter(function(line) {
			return /^\t+/.test(line);
		});
		spaced = lines.filter(function(line) {
			return /^ +/.test(line);
		});
		// More lines tabbed than spaced? Assume tabs, and
		// default to tabs in the case of a tie (or nothing
		// to go on)
		if (tabbed.length >= spaced.length) {
			return '\t';
		}
		// Otherwise, we need to guess the multiple
		min = spaced.reduce(function(previous, current) {
			var numSpaces = /^ +/.exec(current)[0].length;
			return Math.min(numSpaces, previous);
		}, Infinity);
		return new Array(min + 1).join(' ');
	};
	utils_applyIndent = function applyIndent(code, indent) {
		return code.split('\n').map(function(line) {
			return indent + line;
		}).join('\n');
	};
	generators_amd = function() {
		var __export;
		__export = function amd(parsed, options) {
			var guessIndent = utils_guessIndent,
				applyIndent = utils_applyIndent,
				intro, outro, code = '',
				imports = parsed.imports,
				hasExports = parsed.hasExports,
				importPaths = '',
				importNames = '',
				indent;
			if (imports.length) {
				importPaths = '[' + (options.defaultOnly ? imports.map(getPath) : imports.map(getPath).concat('exports')).map(quote).join(',') + '],';
				importNames = (options.defaultOnly ? imports.map(getImportName) : imports.map(getImportName).concat('exports')).join(', ');
			}
			intro = 'define(' + importPaths + 'function (' + importNames + ') {';
			if (options.addUseStrict !== false) {
				code = '\'use' + ' strict\';\n\n';
			}
			if (options.defaultOnly && !parsed.alreadyReturned && hasExports) {
				code += 'var __export;\n\n';
			}
			code += parsed.body;
			if (options.defaultOnly && !parsed.alreadyReturned && hasExports) {
				code += '\nreturn __export;';
			}
			outro = '});';
			indent = options.indent || guessIndent(parsed.body);
			return [
				intro,
				applyIndent(code.trim(), indent),
				outro
			].join('\n\n');
		};

		function quote(str) {
			return '\'' + str + '\'';
		}

		function getPath(x) {
			return x.path;
		}

		function getImportName(x) {
			return x.name;
		}
		return __export;
	}();
	generators_cjs = function(parsed, options) {
		var result = [],
			code = parsed.body.trim(),
			imports = parsed.imports,
			hasExports = parsed.hasExports;
		if (imports.length) {
			result[0] = imports.map(function(x) {
				return 'var ' + x.name + ' = require(\'' + x.path + '\');';
			}).join('\n');
		}
		if (options.defaultOnly && !parsed.alreadyReturned && hasExports) {
			code = 'var __export;\n\n' + code;
		}
		result.push(code);
		if (options.defaultOnly && !parsed.alreadyReturned && hasExports) {
			result.push('module.exports = __export;');
		}
		return result.join('\n');
	};
	esperanto = function(transform, amd, cjs) {
		return {
			toAmd: function(source, options) {
				options = options || {};
				var transformed = transform(source, options, true);
				return amd(transformed, options);
			},
			toCjs: function(source, options) {
				options = options || {};
				var transformed = transform(source, options);
				return cjs(transformed, options);
			}
		};
	}(transform, generators_amd, generators_cjs);
	return esperanto;

}));