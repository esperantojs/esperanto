module.exports = {
	description: 'uses supplied AST',
	modules: {
		'main.js': 'import foo from \'./foo\';\nfoo();',

		// the code points to './bar' but the AST points to './baz', so we
		// can check the AST is being used
		'foo/index.js': {
			code: 'import bar from \'./bar\';\nexport default function foo () {\n\tconsole.log( bar );\n}',
			ast: {
				start: 0,
				body: [
				{
					start: 0,
					specifiers: [{
						start: 7,
						local: {
							start: 7,
							name: "bar",
							type: "Identifier",
							end: 10
						},
						type: "ImportDefaultSpecifier",
						end: 10
					}],
					source: {
						start: 16,
						value: "./baz",
						raw: "\'./baz\'",
						type: "Literal",
						end: 23
					},
					type: "ImportDeclaration",
					end: 24
				},
				{
					start: 25,
					declaration: {
						start: 40,
						id: {
							start: 49,
							name: "foo",
							type: "Identifier",
							end: 52
						},
						generator: false,
						expression: false,
						params: [],
						body: {
							start: 56,
							body: [{
								start: 59,
								expression: {
									start: 59,
									callee: {
										start: 59,
										object: {
											start: 59,
											name: "console",
											type: "Identifier",
											end: 66
										},
										property: {
											start: 67,
											name: "log",
											type: "Identifier",
											end: 70
										},
										computed: false,
										type: "MemberExpression",
										end: 70
									},
									arguments: [
									{
										start: 72,
										name: "bar",
										type: "Identifier",
										end: 75
									}
									],
									type: "CallExpression",
									end: 77
								},
								type: "ExpressionStatement",
								end: 78
							}],
							type: "BlockStatement",
							end: 80
						},
						type: "FunctionDeclaration",
						end: 80
					},
					type: "ExportDefaultDeclaration",
					end: 80
				}],
				sourceType: "module",
				type: "Program",
				end: 80
			}
		},
		'foo/baz.js': 'export default 42;'
	}
};