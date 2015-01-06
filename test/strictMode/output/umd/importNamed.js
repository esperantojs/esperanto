(function (global, factory) {
	typeof define === 'function' && define.amd ? define(['baz'], factory) :
	typeof exports === 'object' ? factory(require('baz')) :
	factory(global.baz)
}(this, function (baz) { 'use strict';

}));