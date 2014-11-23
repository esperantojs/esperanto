import MagicString from 'magic-string';
import transformBody from './transformBody';
import annotateAst from '../../utils/annotateAst';

export default function combine ( bundle ) {
	var body = new MagicString.Bundle({
		separator: '\n\n'
	});

	bundle.modules.forEach( mod => {
		var modBody = mod.body.clone(),
			prefix = bundle.uniqueNames[ mod.id ];

		annotateAst( mod.ast );
		transformBody( bundle, mod, modBody, prefix );

		body.addSource({
			filename: ( mod.id + '.js' ),
			content: modBody
		});
	});

	bundle.body = body;
}
