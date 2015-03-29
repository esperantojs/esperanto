import path from 'path';
import MagicString from 'magic-string';
import populateModuleNames from './populateModuleNames';
import populateExternalModuleImports from './populateExternalModuleImports';
import populateIdentifierReplacements from './populateIdentifierReplacements';
import resolveExports from './resolveExports';
import transformBody from './transformBody';

export default function combine ( bundle ) {
	bundle.body = new MagicString.Bundle({
		separator: '\n\n'
	});

	// give each module in the bundle a unique name
	populateModuleNames( bundle );

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
					throw new Error( `Module '${importedModule.id}' does not export '${s.name}' (imported by '${mod.id}')` );
				}
			});
		});

		bundle.body.addSource({
			filename: path.resolve( bundle.base, mod.relativePath ),
			content: transformBody( bundle, mod, mod.body ),
			indentExclusionRanges: mod.ast._templateLiteralRanges
		});
	});
}
