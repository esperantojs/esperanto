import acorn from 'acorn';
import MagicString from 'magic-string';
import annotateAst from 'utils/ast/annotate';
import findImportsAndExports from 'utils/ast/findImportsAndExports';
import getUnscopedNames from 'utils/ast/getUnscopedNames';
import disallowConflictingImports from '../utils/disallowConflictingImports';
import hasOwnProp from 'utils/hasOwnProp';
import { default as sanitize, splitPath } from 'utils/sanitize';

export default function getStandaloneModule ( options ) {
	var mod, imports, exports, conflicts = {};

	mod = {
		body: new MagicString( options.source ),
		ast: acorn.parse( options.source, {
			ecmaVersion: 6,
			locations: true
		})
	};

	[ imports, exports ] = findImportsAndExports( mod, options.source, mod.ast );

	disallowConflictingImports( imports );

	mod.imports = imports;
	mod.exports = exports;

	if ( options.strict ) {
		annotateAst( mod.ast );

		// TODO there's probably an easier way to get this array
		Object.keys( mod.ast._declared ).concat( getUnscopedNames( mod ) ).forEach( n => {
			conflicts[n] = true;
		});
	}

	determineImportNames( imports, options.getModuleName, conflicts );

	return mod;
}

function determineImportNames ( imports, userFn, usedNames ) {
	var nameById = {};

	usedNames = usedNames || {};

	imports.forEach( x => {
		var moduleId, parts, i, prefix = '', name, candidate;

		moduleId = x.path;

		// use existing value
		if ( hasOwnProp.call( nameById, moduleId ) ) {
			x.name = nameById[ moduleId ];
			return;
		}

		// if user supplied a function, defer to it
		if ( userFn && ( name = userFn( moduleId ) ) ) {
			name = sanitize( name );

			if ( hasOwnProp.call( usedNames, name ) ) {
				// TODO write a test for this
				throw new Error( 'Naming collision: module ' + moduleId + ' cannot be called ' + name );
			}
		}

		else if ( x.isDefault || x.isBatch ) {
			name = x.as;
		}

		else {
			parts = splitPath( moduleId );


			let remaining = 10;

			do {
				i = parts.length;
				while ( i-- > 0 ) {
					candidate = prefix + sanitize( parts.slice( i ).join( '__' ) );

					if ( !hasOwnProp.call( usedNames, candidate ) ) {
						name = candidate;
						break;
					}
				}

				prefix += '_';
			} while ( !name && remaining-- );
		}

		usedNames[ name ] = true;
		nameById[ moduleId ] = name;

		x.name = name;
	});
}
