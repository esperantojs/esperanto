define(['external'], function (external) { 'use strict';

	external = 'default' in external ? external['default'] : external;

	var bar = 'yes';

	console.log( external( bar ) );

});
