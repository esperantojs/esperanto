export default function extend ( target, ...sources ) {
	sources.forEach( source => {
		Object.keys( source ).forEach( key => {
			target[ key ] = source[ key ];
		});
	});

	return target;
}