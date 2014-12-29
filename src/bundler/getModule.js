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

	// collect exports by name, for quick lookup when verifying
	// that this module exports a given identifier
	mod.doesExport = {};
	exports.forEach( x => {
		if ( x.default ) {
			mod.doesExport.default = true;
		}

		else if ( x.name ) {
			mod.doesExport[ x.name ] = true;
		}

		else if ( x.specifiers ) {
			x.specifiers.forEach( s => {
				mod.doesExport[ s.name ] = true;
			});
		}

		else {
			throw new Error( 'Unexpected export type' );
		}
	});

	return mod;
}
