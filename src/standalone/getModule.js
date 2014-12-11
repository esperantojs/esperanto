import acorn from 'acorn';
import MagicString from 'magic-string';
import annotateAst from '../utils/annotateAst';
import findImportsAndExports from '../utils/findImportsAndExports';
import getModuleNameHelper from './getModuleNameHelper';

export default function getStandaloneModule ( options ) {
	var mod, varNames;

	mod = {
		source: options.source,
		body: new MagicString( options.source ),
		ast: acorn.parse( options.source, {
			ecmaVersion: 6,
			locations: true
		}),
		imports: [],
		exports: []
	};

	if ( options.strict ) {
		annotateAst( mod.ast );
		varNames = mod.ast._scope.names.concat( mod.ast._blockScope.names );
	}

	mod.getName = getModuleNameHelper( options.getModuleName, varNames );

	findImportsAndExports( mod, mod.source, mod.ast, mod.imports, mod.exports, options.getModuleName );

	return mod;
}
