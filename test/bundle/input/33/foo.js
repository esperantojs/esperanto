var num = Math.max( 1, 2, 3 );
var resolved = Promise.resolve( num );

export default function foo () {
	return resolved;
}