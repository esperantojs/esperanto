import hasOwnProp from 'utils/hasOwnProp';
import walk from 'utils/ast/walk';

export default function sortModules ( entry ) {
	let seen = {};
	let unordered = [];
	let ordered = [];

	function visit ( mod ) {
		seen[ mod.id ] = true;

		mod.strongDeps = [];
		mod.stronglyDependsOn = {};

		mod.imports.forEach( ( x, i ) => {
			const imported = x.module;

			if ( imported.isExternal || imported.isSkipped ) return;

			if ( stronglyDependsOn( mod, imported ) ) {
				mod.strongDeps.push( imported );
			}

			if ( hasOwnProp.call( seen, imported.id ) ) {
				return;
			}

			visit( imported );
		});

		// add second (and third...) order dependencies
		function addStrongDependencies ( dependency ) {
			if ( hasOwnProp.call( mod.stronglyDependsOn, dependency.id ) ) return;

			mod.stronglyDependsOn[ dependency.id ] = true;
			dependency.strongDeps.forEach( addStrongDependencies );
		}

		mod.strongDeps.forEach( addStrongDependencies );

		unordered.push( mod );
	}

	seen = {};
	visit( entry );

	ordered = [];

	// unordered is actually semi-ordered, as [ fewer dependencies ... more dependencies ]
	unordered.forEach( x => {
		// ensure strong dependencies of x that don't strongly depend on x go first
		x.strongDeps.forEach( place );

		function place ( dep ) {
			if ( !dep.stronglyDependsOn[ x.id ] && !~ordered.indexOf( dep ) ) {
				dep.strongDeps.forEach( place );
				ordered.push( dep );
			}
		}

		if ( !~ordered.indexOf( x ) ) {
			ordered.push( x );
		}
	});

	return ordered;
}

function stronglyDependsOn ( a, b ) {
	let bindings = [];

	// find out which bindings a imports from b
	let i = a.imports.length;
	while ( i-- ) {
		if ( a.imports[i].module === b ) {
			bindings.push.apply( bindings, a.imports[i].specifiers.map( x => x.as ) );
		}
	}

	// see if any of those bindings are referenced at the top level
	let referencedAtTopLevel = false;

	walk( a.ast, {
		enter ( node ) {
			if ( referencedAtTopLevel ) {
				return this.skip();
			}

			if ( /^Import/.test( node.type ) || ( node._scope && node._scope.parent ) ) {
				return this.skip();
			}

			if ( node.type === 'Identifier' && ~bindings.indexOf( node.name ) ) {
				referencedAtTopLevel = true;
			}
		}
	});

	return referencedAtTopLevel;
}