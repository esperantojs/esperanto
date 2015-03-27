define(['bar'], function (Bar) {

	'use strict';

	class Foo extends Bar {
		constructor() {
			super();
			console.log('Foo constructed');
		}
	}

});