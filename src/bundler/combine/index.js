import path from 'path';
import MagicString from 'magic-string';
import getUniqueNames from './getUniqueNames';
import populateExternalModuleImports from './populateExternalModuleImports';
import populateIdentifierReplacements from './populateIdentifierReplacements';
import resolveExports from './resolveExports';
import transformBody from './transformBody';

export default function combine ( bundle ) {
	let body = new MagicString.Bundle({
		separator: '\n\n'
	});

	let declaredInBundle = bundle.modules.reduce( ( declared, mod ) => {
		Object.keys( mod.ast._declared ).forEach( x => declared[x] = true );
		return declared;
	}, {} );

	// populate names
	let uniqueNames = getUniqueNames( bundle.modules, bundle.externalModules, bundle.names, declaredInBundle );
	let setName = mod => mod.name = uniqueNames[ mod.id ];
	bundle.modules.forEach( setName );
	bundle.externalModules.forEach( setName );

	// determine which specifiers are imported from
	// external modules
	populateExternalModuleImports( bundle );

	// determine which identifiers need to be replaced
	// inside this bundle
	populateIdentifierReplacements( bundle );

	bundle.exports = resolveExports( bundle );

	bundle.modules.forEach( mod => {
		// verify that this module doesn't import non-exported identifiers
		mod.imports.forEach( x => {
			let importedModule = bundle.moduleLookup[ x.id ];

			if ( !importedModule || x.isBatch ) {
				return;
			}

			x.specifiers.forEach( s => {
				if ( !importedModule.doesExport[ s.name ] ) {
					throw new Error( 'Module ' + importedModule.id + ' does not export ' + s.name + ' (imported by ' + mod.id + ')' );
				}
			});
		});

		body.addSource({
			filename: path.resolve( bundle.base, mod.relativePath ),
			content: transformBody( bundle, mod, mod.body ),
			indentExclusionRanges: mod.ast._templateLiteralRanges
		});
	});

	bundle.body = body;
}
