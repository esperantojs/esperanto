var warned = {};

export default function packageResult ( body, options, methodName ) {
	var code, map;

	code = body.toString();

	if ( !!options.sourceMap ) {
		if ( !options.sourceMapSource || !options.sourceMapFile ) {
			throw new Error( 'You must provide `sourceMapSource` and `sourceMapFile` options' );
		}

		map = body.generateMap({
			includeContent: true,
			hires: true,
			file: './' + options.sourceMapFile.split( '/' ).pop(),
			source: getRelativePath( options.sourceMapFile, options.sourceMapSource )
		});

		if ( options.sourceMap === 'inline' ) {
			code += '\n//#sourceMappingURL=' + map.toUrl();
			map = null;
		} else {
			code += '\n//# sourceMappingURL=./' + options.sourceMapFile.split( '/' ).pop() + '.map';
		}
	} else {
		map = null;
	}

	return {
		code: code,
		map: map,
		toString: function () {
			if ( !warned[ methodName ] ) {
				console.log( 'Warning: esperanto.' + methodName + '() returns an object with a \'code\' property. You should use this instead of using the returned value directly' );
				warned[ methodName ] = true;
			}

			return code;
		}
	};
}

function getRelativePath ( from, to ) {
	var fromParts, toParts, i;

	fromParts = from.split( '/' );
	toParts = to.split( '/' );

	fromParts.pop(); // get dirname

	while ( fromParts[0] === toParts[0] ) {
		fromParts.shift();
		toParts.shift();
	}

	if ( fromParts.length ) {
		i = fromParts.length;
		while ( i-- ) fromParts[i] = '..';

		return fromParts.concat( toParts ).join( '/' );
	} else {
		toParts.unshift( '.' );
		return toParts.join( '/' );
	}
}