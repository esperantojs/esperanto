module.exports = {
	description: 'uses supplied code',
	modules: {
		'main.js': 'import foo from \'./foo\';\nfoo();',
		'foo/index.js': 'import bar from \'./bar\';\nexport default function foo () {\n\tconsole.log( bar );\n}',
		'foo/bar.js': 'export default 42;'
	}
};