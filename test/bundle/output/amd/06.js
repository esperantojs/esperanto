define(['utils/external'], function (external) { 'use strict';

	external = 'default' in external ? external['default'] : external;

	var message = 'this is a message';

	console.log( external( message ) );

});
