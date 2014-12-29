import path from 'path';
import MagicString from 'magic-string';
import getIdentifierReplacements from './getIdentifierReplacements';
import resolveExports from './resolveExports';
import transformBody from './transformBody';

export default function combine ( bundle ) {
	var body;

	body = new MagicString.Bundle({
		separator: '\n\n'
	});

	bundle.identifierReplacements = getIdentifierReplacements( bundle );

	bundle.exports = resolveExports( bundle );

	bundle.modules.forEach( mod => {
		var modBody = mod.body.clone(),
			prefix = bundle.uniqueNames[ mod.id ];

		// verify that this module doesn't import non-exported identifiers
		mod.imports.forEach( x => {
			var importedModule = bundle.moduleLookup[ x.id ];

			if ( !importedModule ) {
				return;
			}

			x.specifiers.forEach( s => {
				if ( s.batch ) {
					return;
				}

				if ( !importedModule.doesExport[ s.name ] ) {
					throw new Error( 'Module ' + importedModule.id + ' does not export ' + s.name + ' (imported by ' + mod.id + ')' );
				}
			});
		});

		transformBody( bundle, mod, modBody, prefix );

		body.addSource({
			filename: path.resolve( bundle.base, mod.file ),
			content: modBody
		});
	});

	bundle.body = body;
}
