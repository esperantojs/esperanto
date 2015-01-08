(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(require('baz')) :
	typeof define === 'function' && define.amd ? define(['baz'], factory) :
	factory(global.baz)
}(this, function (baz) { 'use strict';

}));