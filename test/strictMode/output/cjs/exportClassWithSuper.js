'use strict';

var Bar = require('bar');

class Foo extends Bar['default'] {
	constructor() {
		super();
		console.log('Foo constructed');
	}
}