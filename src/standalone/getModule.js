import acorn from 'acorn';
import MagicString from 'magic-string';
import annotateAst from '../utils/ast/annotate';
import findImportsAndExports from '../utils/ast/findImportsAndExports';
import getModuleNameHelper from './getModuleNameHelper';

export default function getStandaloneModule ( options ) {
	var mod, varNames, imports, exports;

	mod = {
		source: options.source,
		body: new MagicString( options.source ),
		ast: acorn.parse( options.source, {
			ecmaVersion: 6,
			locations: true
		})
	};

	if ( options.strict ) {
		annotateAst( mod.ast );
		varNames = mod.ast._scope.names.concat( mod.ast._blockScope.names );
	}

	mod.getName = getModuleNameHelper( options.getModuleName, varNames );

	[ imports, exports ] = findImportsAndExports( mod, mod.source, mod.ast );

	mod.imports = imports;
	mod.exports = exports;

	return mod;
}
