process.chdir( __dirname );

var testModules = [
	'fastMode',
	'strictMode',
	'bundle',
	'sourcemaps'
];

var results = testModules.map( function ( mod ) {
	return require( './' + mod )();
});

require( 'sander' ).Promise.all( results ).then( function ( allStats ) {
	testModules.forEach( function ( mod, i ) {
		var stats = allStats[i];
		var keys = Object.keys( stats ).filter( function ( key ) { return key !== 'total'; });

		console.log( '\ncompleted %s in %sms', mod, stats.total );

		if ( keys.length ) {
			keys.forEach( function ( key ) {
				console.log( '  %s: %sms', key, stats[ key ].toFixed( 1 ) );
			});
		}
	});
});