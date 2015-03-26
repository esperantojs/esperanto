(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(require('./foo')) :
	typeof define === 'function' && define.amd ? define(['./foo'], factory) :
	factory(global.___foo)
}(this, function (___foo) { 'use strict';

	var obj = {
		foo: function foo () {}
	};

	___foo.foo();

}));