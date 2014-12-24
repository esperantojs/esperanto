import acorn from 'acorn';
import MagicString from 'magic-string';
import findImportsAndExports from '../utils/ast/findImportsAndExports';

export default function getModule ( mod ) {
	var imports, exports;

	mod.body = new MagicString( mod.source );

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

	[ imports, exports ] = findImportsAndExports( mod, mod.source, mod.ast );

	mod.imports = imports;
	mod.exports = exports;

	return mod;
}
