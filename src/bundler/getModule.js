import acorn from 'acorn';
import MagicString from 'magic-string';
import findImportsAndExports from 'utils/ast/findImportsAndExports';
import annotateAst from 'utils/ast/annotate';
import disallowConflictingImports from '../utils/disallowConflictingImports';

export default function getModule ( mod ) {
	var imports, exports;

	mod.body = new MagicString( mod.source );

	let toRemove = [];

	try {
		mod.ast = acorn.parse( mod.source, {
			ecmaVersion: 6,
			sourceType: 'module',
			onComment ( block, text, start, end ) {
				// sourceMappingURL comments should be removed
				if ( !block && /^# sourceMappingURL=/.test( text ) ) {
					toRemove.push({ start, end });
				}
			}
		});

		toRemove.forEach( ({ start, end }) => mod.body.remove( start, end ) );
		annotateAst( mod.ast );
	} catch ( err ) {
		// If there's a parse error, attach file info
		// before throwing the error
		if ( err.loc ) {
			err.file = mod.path;
		}

		throw err;
	}

	[ imports, exports ] = findImportsAndExports( mod, mod.source, mod.ast );

	disallowConflictingImports( imports );

	mod.imports = imports;
	mod.exports = exports;

	// identifiers to replace within this module
	// (gets filled in later, once bundle is combined)
	mod.identifierReplacements = {};

	// collect exports by name, for quick lookup when verifying
	// that this module exports a given identifier
	mod.doesExport = {};

	exports.forEach( x => {
		if ( x.isDefault ) {
			mod.doesExport.default = true;
		}

		else if ( x.name ) {
			mod.doesExport[ x.name ] = true;
		}

		else if ( x.specifiers ) {
			x.specifiers.forEach( s => {
				mod.doesExport[ s.as ] = true;
			});
		}

		else {
			throw new Error( 'Unexpected export type' );
		}
	});

	return mod;
}
