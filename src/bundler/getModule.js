import { parse } from 'acorn';
import MagicString from 'magic-string';
import findImportsAndExports from 'utils/ast/findImportsAndExports';
import annotateAst from 'utils/ast/annotate';
import disallowConflictingImports from '../utils/disallowConflictingImports';

export default function getModule ( mod ) {
	mod.body = new MagicString( mod.code );

	let toRemove = [];

	try {
		mod.ast = mod.ast || ( parse( mod.code, {
			ecmaVersion: 6,
			sourceType: 'module',
			onComment ( block, text, start, end ) {
				// sourceMappingURL comments should be removed
				if ( !block && /^# sourceMappingURL=/.test( text ) ) {
					toRemove.push({ start, end });
				}
			}
		}));
	} catch ( err ) {
		// If there's a parse error, attach file info
		// before throwing the error
		if ( err.loc ) {
			err.file = mod.path;
		}

		throw err;
	}

	// remove sourceMappingURL comments
	toRemove.forEach( ({ start, end }) => mod.body.remove( start, end ) );

	let { imports, exports, defaultExport } = findImportsAndExports( mod.ast, mod.code );

	disallowConflictingImports( imports );

	mod.imports = imports;
	mod.exports = exports;
	mod.defaultExport = defaultExport;

	const defaultExportIdentifier = defaultExport &&
	                                defaultExport.type === 'expression' &&
	                                defaultExport.node.declaration &&
	                                defaultExport.node.declaration.type === 'Identifier' &&
	                                defaultExport.node.declaration;

	// if the default export is an expression like `export default foo`, we
	// can *probably* just use `foo` to refer to said export throughout the
	// bundle. Tracking assignments to `foo` allows us to be sure that that's
	// the case (i.e. that the module doesn't assign a different value to foo
	// after it's been exported)
	annotateAst( mod.ast, {
		trackAssignments: defaultExportIdentifier
	});

	if ( defaultExportIdentifier && defaultExportIdentifier._assignments ) {
		let i = defaultExportIdentifier._assignments.length;
		while ( i-- ) {
			const assignment = defaultExportIdentifier._assignments[i];

			// if either a) the assignment happens inside a function body, or
			// b) it happens after the `export default ...`, then it's unsafe to
			// use the identifier, and we need to essentially do `var _foo = foo`
			if ( assignment.scope.parent || assignment.node.start > defaultExport.start ) {
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
