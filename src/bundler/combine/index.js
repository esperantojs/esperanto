import path from 'path';
import MagicString from 'magic-string';
import topLevelScopeConflicts from './topLevelScopeConflicts';
import importsByModule from './importsByModule';
import transformBody from './transformBody';
import annotateAst from '../../utils/annotateAst';

export default function combine ( bundle ) {
	var body = new MagicString.Bundle({
		separator: '\n\n'
	});

	bundle.modules.forEach( mod => {
		annotateAst( mod.ast );
	});

	var conflicts = topLevelScopeConflicts( bundle );
	bundle.conflicts = conflicts;

	var imports = importsByModule( bundle );
	bundle.importsByModule = imports;

	bundle.modules.forEach( mod => {
		var modBody = mod.body.clone(),
			prefix = bundle.uniqueNames[ mod.id ];

		transformBody( bundle, mod, modBody, prefix, conflicts );

		body.addSource({
			filename: path.resolve( bundle.base, mod.file ),
			content: modBody
		});
	});

	bundle.body = body;
}
