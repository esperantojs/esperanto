import acorn from 'acorn';
import MagicString from 'magic-string';
import annotateAst from 'utils/ast/annotate';
import findImportsAndExports from 'utils/ast/findImportsAndExports';
import reorderImports from 'utils/reorderImports';
import getModuleNameHelper from './getModuleNameHelper';

export default function getStandaloneModule ( options ) {
	var mod, imports, exports;

	mod = {
		body: new MagicString( options.source ),
		ast: acorn.parse( options.source, {
			ecmaVersion: 6,
			locations: true
		})
	};

	if ( options.strict ) {
		annotateAst( mod.ast );
	}

	mod.getName = getModuleNameHelper( options.getModuleName, mod.ast._declared );

	[ imports, exports ] = findImportsAndExports( mod, options.source, mod.ast );

	reorderImports( imports );

	mod.imports = imports;
	mod.exports = exports;

	return mod;
}
