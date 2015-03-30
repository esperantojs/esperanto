let startTimes = {};

export function startTimer ( id ) {
	startTimes[ id || '__' ] = process.hrtime();
}

export function endTimer ( id ) {
	let [ seconds, nanoseconds ] = process.hrtime( startTimes[ id || '__' ] );
	return ( seconds * 1000 ) + ( nanoseconds / 1000000 );
}