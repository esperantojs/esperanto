import hasOwnProp from 'utils/hasOwnProp';
import walk from 'utils/ast/walk';

export default function sortModules ( entry ) {
	let seen = {};
	let ordered = [];
	let swapPairs = [];

	function visit ( mod ) {
		seen[ mod.id ] = true;

		mod.imports.forEach( x => {
			const imported = x.module;

			if ( imported.isExternal || imported.isSkipped ) return;

			// ignore modules we've already included
			if ( hasOwnProp.call( seen, imported.id ) ) {
				if ( shouldSwap( imported, mod ) ) {
					swapPairs.push([ imported, mod ]);
				}

				return;
			}

			visit( imported );
		});

		ordered.push( mod );
	}

	visit( entry );

	swapPairs.forEach( ([ a, b ]) => {
		const aIndex = ordered.indexOf( a );
		const bIndex = ordered.indexOf( b );

		ordered[ aIndex ] = b;
		ordered[ bIndex ] = a;
	});

	return ordered;
}

function shouldSwap ( a, b ) {
	// if these modules don't import each other, abort
	if ( !( imports( a, b ) && imports( b, a ) ) ) return;

	return usesAtTopLevel( b, a ) && !usesAtTopLevel( a, b );
}

function imports ( a, b ) {
	let i = a.imports.length;
	while ( i-- ) {
		if ( a.imports[i].module === b ) {
			return true;
		}
	}
}

function usesAtTopLevel ( a, b ) {
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