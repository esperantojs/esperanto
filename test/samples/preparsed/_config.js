module.exports = {
	description: 'uses existing AST',
	ast: {
		start: 0,
		body: [{
			start: 0,
			specifiers: [{
				start: 7,
				local: {
					start: 7,
					name: 'foo',
					type: 'Identifier',
					end: 10
				},
				type: 'ImportDefaultSpecifier',
				end: 10
			}],
			source: {
				start: 16,
				value: './bar',   // this is different from the original source
				raw: '\'./bar\'', // and should show up in the results...
				type: 'Literal',
				end: 23
			},
			type: 'ImportDeclaration',
			end: 24
		}],
		sourceType: 'module',
		type: 'Program',
		end: 24
	}
};