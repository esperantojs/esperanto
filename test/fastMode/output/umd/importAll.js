(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(require('fs')) :
	typeof define === 'function' && define.amd ? define(['fs'], factory) :
	factory(global.fs)
}(this, function (fs) { 'use strict';

}));