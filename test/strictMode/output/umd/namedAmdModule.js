(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(require('foo')) :
	typeof define === 'function' && define.amd ? define('myModule', ['foo'], factory) :
	factory(global.foo)
}(this, function (foo) { 'use strict';

	foo['default']();

}));