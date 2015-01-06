(function (global, factory) {
	typeof define === 'function' && define.amd ? define(['foo'], factory) :
	typeof exports === 'object' ? factory(require('foo')) :
	factory(global.foo)
}(this, function (foo) { 'use strict';

	'use strict';

	console.log( foo );

}));