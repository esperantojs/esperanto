define(['external'], function (foo) {

	'use strict';

	foo = ('default' in foo ? foo['default'] : foo);

	foo();

});