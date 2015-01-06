(function (global, factory) {
	typeof define === 'function' && define.amd ? define(['foo'], factory) :
	typeof exports === 'object' ? factory(require('foo')) :
	factory(global._foo)
}(this, function (_foo) { 'use strict';

	var foo = 'should not clash';

	_foo.bar();

}));