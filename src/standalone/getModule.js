import acorn from 'acorn';
import MagicString from 'magic-string';
import annotateAst from 'utils/ast/annotate';
import findImportsAndExports from 'utils/ast/findImportsAndExports';
import getUnscopedNames from 'utils/ast/getUnscopedNames';
import getModuleNameHelper from './getModuleNameHelper';

export default function getStandaloneModule ( options ) {
	var mod, imports, exports, conflicts = {};

	mod = {
		body: new MagicString( options.source ),
		ast: acorn.parse( options.source, {
			ecmaVersion: 6,
			locations: true
		})
	};

	[ imports, exports ] = findImportsAndExports( mod, options.source, mod.ast );


	mod.imports = imports;
	mod.exports = exports;

	if ( options.strict ) {
		annotateAst( mod.ast );

		// TODO there's probably an easier way to get this array
		Object.keys( mod.ast._declared ).concat( getUnscopedNames( mod ) ).forEach( n => {
			conflicts[n] = true;
		});
	} else {
		conflicts = mod.ast._declared;
	}

	mod.getName = getModuleNameHelper( options.getModuleName, conflicts );

	return mod;
}