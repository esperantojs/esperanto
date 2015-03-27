export default function walk ( ast, { enter, leave }) {
	visit( ast, null, enter, leave );
}

function visit ( node, parent, enter, leave ) {
	let shouldSkip = false;

	if ( enter ) {
		enter.call({
			skip: () => shouldSkip = true
		}, node, parent );
	}

	if ( shouldSkip ) return;

	let keys = Object.keys( node );
	let key, value, i, j, numKeys, numChildren;

	numKeys = keys.length;
	for ( i = 0; i < numKeys; i += 1 ) {
		key = keys[i];
		value = node[ key ];

		if ( isArray( value ) ) {
			numChildren = value.length;
			for ( j = 0; j < numChildren; j += 1 ) {
				visit( value[j], node, enter, leave );
			}
		}

		else if ( value && typeof value === 'object' ) {
			visit( value, node, enter, leave );
		}
	}

	if ( leave ) {
		leave.call( null, node, parent );
	}
}

let toString = Object.prototype.toString;

function isArray ( thing ) {
	return toString.call( thing ) === '[object Array]';
}