import acorn from 'acorn';
import MagicString from 'magic-string';
import annotateAst from 'utils/ast/annotate';
import findImportsAndExports from 'utils/ast/findImportsAndExports';
import getUnscopedNames from 'utils/ast/getUnscopedNames';
import disallowConflictingImports from '../utils/disallowConflictingImports';
import hasOwnProp from 'utils/hasOwnProp';
import { default as sanitize, splitPath } from 'utils/sanitize';
import { startTimer, endTimer } from 'utils/time';

const SOURCEMAPPINGURL_REGEX = /^# sourceMappingURL=/;

export default function getStandaloneModule ( options ) {
	startTimer( 'analyse' );

	let mod = {
		body: null,
		ast: null,
		imports: null,
		exports: null,
		stats: null
	};

	mod.stats = {
		parseTime: null
	};

	let toRemove = [];

	mod.body = new MagicString( options.source );

	startTimer();
	mod.ast = acorn.parse( options.source, {
		ecmaVersion: 6,
		sourceType: 'module',
		onComment ( block, text, start, end ) {
			// sourceMappingURL comments should be removed
			if ( !block && SOURCEMAPPINGURL_REGEX.test( text ) ) {
				toRemove.push({ start, end });
			}
		}
	});
	mod.stats.parseTime = endTimer();

	toRemove.forEach( ({ start, end }) => mod.body.remove( start, end ) );

	let [ imports, exports ] = findImportsAndExports( mod, options.source, mod.ast );

	disallowConflictingImports( imports );

	mod.imports = imports;
	mod.exports = exports;

	let conflicts = {};

	if ( options.strict ) {
		startTimer();
		annotateAst( mod.ast );
		mod.stats.annotateAst = endTimer();

		// TODO there's probably an easier way to get this array
		Object.keys( mod.ast._declared ).concat( getUnscopedNames( mod ) ).forEach( n => {
			conflicts[n] = true;
		});
	}

	startTimer();
	determineImportNames( imports, options.getModuleName, conflicts );
	mod.stats.determineImportNames = endTimer();

	mod.stats.analyse = endTimer( 'analyse' );

	return mod;
}

function determineImportNames ( imports, userFn, usedNames ) {
	let nameById = {};
	let inferredNames = {};

	imports.forEach( x => {
		let moduleId = x.path;
		let name;

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
				throw new Error( `Naming collision: module ${moduleId} cannot be called ${name}` );
			}
		}

		else {
			let parts = splitPath( moduleId );
			let i;
			let prefix = '';
			let candidate;

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
			} while ( !name );
		}

		usedNames[ name ] = true;
		nameById[ moduleId ] = name;

		x.name = name;
	});

	// use inferred names for default imports, wherever they
	// don't clash with path-based names
	imports.forEach( x => {
		if ( x.as && !hasOwnProp.call( usedNames, x.as ) ) {
			inferredNames[ x.path ] = x.as;
		}
	});

	imports.forEach( x => {
		if ( hasOwnProp.call( inferredNames, x.path ) ) {
			x.name = inferredNames[ x.path ];
		}
	});
}
