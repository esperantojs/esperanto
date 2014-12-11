import acorn from 'acorn';
import MagicString from 'magic-string';
import findImportsAndExports from '../utils/findImportsAndExports';

export default function getStandaloneModule ( mod ) {
	mod.body = new MagicString( mod.source );
	mod.imports = [];
	mod.exports = [];

	try {
		mod.ast = acorn.parse( mod.source, {
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

	findImportsAndExports( mod, mod.source, mod.ast, mod.imports, mod.exports );

	return mod;
}
