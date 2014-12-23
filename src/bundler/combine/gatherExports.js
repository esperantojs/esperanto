export default function gatherExports ( exports, toRewrite, prefix, conflicts ) {
	exports.forEach( x => {
		if ( x.declaration ) {
			var name = x.name;
			if ( !toRewrite.hasOwnProperty( name ) ) {
				toRewrite[ name ] = conflicts.hasOwnProperty( name ) ?
					prefix + '__' + name :
					name;
			}
		} else if ( x.specifiers ) {
			x.specifiers.forEach( s => {
				if ( !toRewrite.hasOwnProperty( s.name ) ) {
					toRewrite[ s.name ] = conflicts.hasOwnProperty( s.name ) ?
						prefix + '__' + s.name :
						s.name;
				}
			});
		}
	});
}
