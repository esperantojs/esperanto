define(['bar'], function (Bar) {

	'use strict';

	class Foo extends Bar['default'] {
		constructor() {
			super();
			console.log('Foo constructed');
		}
	}

});