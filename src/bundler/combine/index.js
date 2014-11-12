import MagicString from 'magic-string';
import transformBody from './transformBody';
import annotateAst from '../../utils/annotateAst';

export default function Bundle$_combine ( bundle ) {
	var getModuleName = bundle.getName;

	var body = bundle.modules.map( mod => {
		var modBody = mod.body.clone(),
			prefix = bundle.uniqueNames[ mod.id ];

		annotateAst( mod.ast );
		transformBody( bundle, mod, modBody, prefix );

		return modBody.toString();
	}).join( '\n\n' );

	bundle.body = new MagicString( body );
}
