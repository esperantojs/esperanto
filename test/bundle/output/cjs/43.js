'use strict';

var Bar = require('bar');
Bar = 'default' in Bar ? Bar['default'] : Bar;

class Foo extends Bar {
	constructor() {
		super();
		console.log('Foo constructed');
	}
}