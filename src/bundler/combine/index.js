import path from 'path';
import MagicString from 'magic-string';
import populateExternalModuleImports from './populateExternalModuleImports';
import populateIdentifierReplacements from './populateIdentifierReplacements';
import resolveExports from './resolveExports';
import transformBody from './transformBody';

export default function combine ( bundle ) {
	var body;

	body = new MagicString.Bundle({
		separator: '\n\n'
	});

	// populate names
	var setName = mod => mod.name = bundle.uniqueNames[ mod.id ];
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
			var importedModule = bundle.moduleLookup[ x.id ];

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
			filename: path.resolve( bundle.base, mod.file ),
			content: transformBody( bundle, mod, mod.body.clone() ),
			indentExclusionRanges: mod.ast._templateLiteralRanges
		});
	});

	bundle.body = body;
}
