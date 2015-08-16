(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(require('bar')) :
	typeof define === 'function' && define.amd ? define(['bar'], factory) :
	factory(global.Bar);
}(this, function (Bar) { 'use strict';

	Bar = 'default' in Bar ? Bar['default'] : Bar;

	class Foo extends Bar {
		constructor() {
			super();
			console.log('Foo constructed');
		}
	}

}));