'use strict';

function dependsOnExternal () {
	console.log( external.message );
}

function external () {
	dependsOnExternal();
}

external.message = 'don\'t try this at home';

external();