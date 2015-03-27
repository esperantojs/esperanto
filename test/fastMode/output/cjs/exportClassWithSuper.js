'use strict';

var Bar = require('bar');

class Foo extends Bar {
	constructor() {
		super();
		console.log('Foo constructed');
	}
}