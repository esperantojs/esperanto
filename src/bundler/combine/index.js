import path from 'path';
import MagicString from 'magic-string';
import resolveExports from './resolveExports';
import transformBody from './transformBody';
import annotateAst from '../../utils/annotateAst';

export default function combine ( bundle ) {
	var body;

	body = new MagicString.Bundle({
		separator: '\n\n'
	});

	bundle.exports = resolveExports( bundle );

	bundle.modules.forEach( mod => {
		var modBody = mod.body.clone(),
			prefix = bundle.uniqueNames[ mod.id ];

		annotateAst( mod.ast );
		transformBody( bundle, mod, modBody, prefix );

		body.addSource({
			filename: path.resolve( bundle.base, mod.file ),
			content: modBody
		});
	});

	bundle.body = body;
}
