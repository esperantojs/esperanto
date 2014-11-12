import acorn from 'acorn';
import MagicString from 'magic-string';
//import parse from '../Module/prototype/parse';
import findImportsAndExports from '../utils/findImportsAndExports';
import getModuleNameHelper from '../utils/getModuleNameHelper';

export default function getStandaloneModule ( options ) {
	var mod;

	mod = {
		id: options.id,
		file: options.file,
		//name: options.name, // TODO we shouldn't know this yet
		source: options.source,
		body: new MagicString( options.source ),
		ast: acorn.parse( options.source, {
			ecmaVersion: 6,
			locations: true
		}),
		imports: [],
		exports: [],
		getName: getModuleNameHelper( options.getModuleName )
	};

	findImportsAndExports( mod, mod.source, mod.ast, mod.imports, mod.exports, options.getModuleName );

	return mod;
}
