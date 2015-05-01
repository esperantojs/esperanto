process.chdir( __dirname );

var testModules = [
	// 'fastMode',
	// 'strictMode',
	'bundle',
	// 'sourcemaps'
];

var results = testModules.map( function ( mod ) {
	return require( './' + mod )();
});

require( 'sander' ).Promise.all( results ).then( function ( completionTimes ) {
	testModules.forEach( function ( mod, i ) {
		console.log( 'completed %s in %sms', mod, completionTimes[i] );
	});
});